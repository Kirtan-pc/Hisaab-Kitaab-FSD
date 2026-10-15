const assert = require("node:assert/strict");
const { once } = require("node:events");
const { after, before, test } = require("node:test");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Shop = require("../models/Shop");

process.env.CORS_ORIGIN = "http://localhost:5173";
process.env.JWT_SECRET = "test-only-secret-that-is-at-least-32-characters";

const { app } = require("../server");
const { createAccessToken } = require("../middleware/authMiddleware");

const shopId = "507f1f77bcf86cd799439011";
const validPassword = "correct-horse-battery-staple";
let server;
let apiUrl;

before(async () => {
  server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  apiUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  server.close();
  await once(server, "close");
});

async function postJson(path, body) {
  return fetch(`${apiUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function fakeShop(fields = {}) {
  return {
    _id: shopId,
    name: "Shankar Tea Stall",
    email: "shop@example.com",
    ownerPhone: "9876543210",
    role: "user",
    ...fields,
  };
}

function authorization(token) {
  return { Authorization: `Bearer ${token}` };
}

test("registration normalizes email, hashes the password, and assigns user role", async (t) => {
  t.mock.method(Shop, "create", async (fields) => {
    assert.equal(fields.email, "shop@example.com");
    assert.equal(fields.role, "user");
    assert.notEqual(fields.passwordHash, validPassword);
    assert.equal(await bcrypt.compare(validPassword, fields.passwordHash), true);
    return fakeShop(fields);
  });

  const response = await postJson("/api/auth/register", {
    name: "Shankar Tea Stall",
    email: " SHOP@EXAMPLE.COM ",
    ownerPhone: "9876543210",
    password: validPassword,
  });
  const body = await response.json();

  assert.equal(response.status, 201);
  assert.equal(body.shop.role, "user");
  assert.equal(body.shop.email, "shop@example.com");
  assert.equal(typeof body.token, "string");
  assert.equal(Object.hasOwn(body.shop, "passwordHash"), false);
});

test("duplicate registration returns a safe conflict response", async (t) => {
  t.mock.method(Shop, "create", async () => {
    const error = new Error("duplicate email");
    error.code = 11000;
    throw error;
  });

  const response = await postJson("/api/auth/register", {
    name: "Duplicate Shop",
    email: "shop@example.com",
    ownerPhone: "9876543211",
    password: validPassword,
  });

  assert.equal(response.status, 409);
  assert.deepEqual(await response.json(), {
    message: "A record with that unique value already exists.",
  });
});

test("registration rejects invalid email and missing fields before database access", async () => {
  const invalidEmail = await postJson("/api/auth/register", {
    name: "Shankar Tea Stall",
    email: "not-an-email",
    ownerPhone: "9876543210",
    password: validPassword,
  });
  const missingFields = await postJson("/api/auth/register", {});

  assert.equal(invalidEmail.status, 400);
  assert.equal(missingFields.status, 400);
});

test("public registration cannot assign the administrator role", async () => {
  const response = await postJson("/api/auth/register", {
    name: "Untrusted Shop",
    email: "attacker@example.com",
    ownerPhone: "9876543212",
    password: validPassword,
    role: "admin",
  });
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.errors[0].field, "role");
});

test("valid email login returns an account token", async (t) => {
  const passwordHash = await bcrypt.hash(validPassword, 4);
  t.mock.method(Shop, "findOne", (query) => {
    if (query.email) {
      assert.deepEqual(query, { email: "shop@example.com" });
    } else {
      assert.deepEqual(query, { ownerPhone: "9876543210" });
    }
    return { select: async () => fakeShop({ passwordHash }) };
  });

  const response = await postJson("/api/auth/login", {
    email: "SHOP@EXAMPLE.COM",
    password: validPassword,
  });
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.shop.role, "user");
  assert.equal(Object.hasOwn(body.shop, "passwordHash"), false);
  assert.equal(typeof body.token, "string");

  const phoneLogin = await postJson("/api/auth/login", {
    ownerPhone: "9876543210",
    password: validPassword,
  });
  assert.equal(phoneLogin.status, 200);
});

test("incorrect and missing login credentials are rejected", async (t) => {
  const passwordHash = await bcrypt.hash(validPassword, 4);
  t.mock.method(Shop, "findOne", () => ({
    select: async () => fakeShop({ passwordHash }),
  }));

  const incorrect = await postJson("/api/auth/login", {
    email: "shop@example.com",
    password: "incorrect-password",
  });
  const missing = await postJson("/api/auth/login", {});

  assert.equal(incorrect.status, 401);
  assert.deepEqual(await incorrect.json(), {
    message: "Email/phone or password is incorrect.",
  });
  assert.equal(missing.status, 400);
});

test("protected endpoint rejects a missing bearer token", async () => {
  const response = await fetch(`${apiUrl}/api/protected`);
  assert.equal(response.status, 401);
});

test("protected endpoints reject invalid, expired, and client-forged admin tokens", async () => {
  const invalid = await fetch(`${apiUrl}/api/protected`, {
    headers: authorization("not-a-jwt"),
  });
  const expiredToken = jwt.sign({ role: "user" }, process.env.JWT_SECRET, {
    algorithm: "HS256",
    subject: shopId,
    issuer: "hisaab-kitaab-api",
    audience: "hisaab-kitaab-client",
    expiresIn: -1,
  });
  const expired = await fetch(`${apiUrl}/api/protected`, {
    headers: authorization(expiredToken),
  });
  const forgedToken = jwt.sign({ role: "admin" }, "attacker-controlled-secret", {
    algorithm: "HS256",
    subject: shopId,
    issuer: "hisaab-kitaab-api",
    audience: "hisaab-kitaab-client",
    expiresIn: "1h",
  });
  const forged = await fetch(`${apiUrl}/api/admin`, {
    headers: authorization(forgedToken),
  });
  const notYetValidToken = jwt.sign({ role: "user" }, process.env.JWT_SECRET, {
    algorithm: "HS256",
    subject: shopId,
    issuer: "hisaab-kitaab-api",
    audience: "hisaab-kitaab-client",
    notBefore: "1h",
    expiresIn: "2h",
  });
  const notYetValid = await fetch(`${apiUrl}/api/protected`, {
    headers: authorization(notYetValidToken),
  });
  const invalidRoleToken = jwt.sign(
    { role: "superuser" },
    process.env.JWT_SECRET,
    {
      algorithm: "HS256",
      subject: shopId,
      issuer: "hisaab-kitaab-api",
      audience: "hisaab-kitaab-client",
      expiresIn: "1h",
    },
  );
  const invalidRole = await fetch(`${apiUrl}/api/protected`, {
    headers: authorization(invalidRoleToken),
  });

  assert.equal(invalid.status, 401);
  assert.equal(expired.status, 401);
  assert.equal(forged.status, 401);
  assert.equal(notYetValid.status, 401);
  assert.equal(invalidRole.status, 401);
});

test("ordinary accounts access protected routes but receive 403 for admin routes", async () => {
  const userToken = createAccessToken(shopId, "user");
  const protectedResponse = await fetch(`${apiUrl}/api/protected`, {
    headers: authorization(userToken),
  });
  const adminResponse = await fetch(`${apiUrl}/api/admin?role=admin`, {
    headers: authorization(userToken),
  });

  assert.equal(protectedResponse.status, 200);
  assert.equal((await protectedResponse.json()).account.role, "user");
  assert.equal(adminResponse.status, 403);
});

test("shop-scoped routes do not allow a user to request another shop's data", async () => {
  const userToken = createAccessToken(shopId, "user");
  const response = await fetch(
    `${apiUrl}/api/customers/shop/507f1f77bcf86cd799439012`,
    { headers: authorization(userToken) },
  );

  assert.equal(response.status, 404);
});

test("administrator token can access the administrator endpoint", async () => {
  const adminToken = createAccessToken(shopId, "admin");
  const response = await fetch(`${apiUrl}/api/admin`, {
    headers: authorization(adminToken),
  });

  assert.equal(response.status, 200);
  assert.equal((await response.json()).account.role, "admin");
});

test("legacy tokens without a role remain ordinary-user tokens", async () => {
  const legacyToken = jwt.sign({}, process.env.JWT_SECRET, {
    algorithm: "HS256",
    subject: shopId,
    issuer: "hisaab-kitaab-api",
    audience: "hisaab-kitaab-client",
    expiresIn: "1h",
  });
  const response = await fetch(`${apiUrl}/api/protected`, {
    headers: authorization(legacyToken),
  });

  assert.equal(response.status, 200);
  assert.equal((await response.json()).account.role, "user");
});

test("me endpoint returns safe authenticated account information", async (t) => {
  t.mock.method(Shop, "findById", (id) => {
    assert.equal(id, shopId);
    return {
      select: async () =>
        fakeShop({ role: "admin" }),
    };
  });
  const response = await fetch(`${apiUrl}/api/auth/me`, {
    headers: authorization(createAccessToken(shopId, "admin")),
  });
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.id, shopId);
  assert.equal(body.role, "admin");
  assert.equal(Object.hasOwn(body, "passwordHash"), false);
});
