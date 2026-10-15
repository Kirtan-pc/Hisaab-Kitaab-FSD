const assert = require("node:assert/strict");
const { once } = require("node:events");
const { after, before, test } = require("node:test");
const Shop = require("../models/Shop");

process.env.CORS_ORIGIN = "http://localhost:5173";
process.env.JWT_SECRET = "test-only-secret-that-is-at-least-32-characters";
const { app } = require("../server");
const { createAccessToken, requireAuth } = require("../middleware/authMiddleware");

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

test("health endpoint includes security headers and does not need a database", async () => {
  const response = await fetch(`${apiUrl}/api/health`, {
    headers: { Origin: "http://localhost:5173" },
  });
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("x-powered-by"), null);
  assert.equal(body.service, "hisaab-kitaab-api");
});

test("shop ledger routes require a bearer token", async () => {
  const response = await fetch(
    `${apiUrl}/api/orders/shop/507f1f77bcf86cd799439011`,
  );

  assert.equal(response.status, 401);
  assert.match((await response.json()).message, /bearer token/i);
});

test("a verified JWT supplies the shop identity to protected middleware", () => {
  const shopId = "507f1f77bcf86cd799439011";
  const req = {
    get: () => `Bearer ${createAccessToken(shopId)}`,
  };
  let nextCalled = false;

  requireAuth(req, {}, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.deepEqual(req.auth, { shopId, role: "user" });
});

test("registration rejects fields that could bypass the public shop model", async () => {
  const response = await fetch(`${apiUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Shankar Tea Stall",
      email: "shop@example.com",
      ownerPhone: "9876543210",
      password: "sample-password-long",
      isAdmin: true,
    }),
  });
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.errors[0].field, "isAdmin");
});

test("registration reports invalid field values before accessing MongoDB", async () => {
  const response = await fetch(`${apiUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: " ",
      email: "not-an-email",
      ownerPhone: "not-a-phone",
      password: "short",
    }),
  });
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.deepEqual(
    body.errors.map((error) => error.field).sort(),
    ["email", "name", "ownerPhone", "password"],
  );
});

test("malformed JSON receives a safe client error", async () => {
  const response = await fetch(`${apiUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: '{"ownerPhone":',
  });

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    message: "Request body contains invalid JSON.",
  });
});

test("disallowed browser origins receive a forbidden response", async () => {
  const response = await fetch(`${apiUrl}/api/health`, {
    headers: { Origin: "https://untrusted.example" },
  });

  assert.equal(response.status, 403);
});

test("serialized shop documents never expose a password hash", () => {
  const shop = new Shop({
    name: "Shankar Tea Stall",
    ownerPhone: "9876543210",
    passwordHash: "this-is-only-a-test-hash",
  }).toJSON();

  assert.equal(Object.hasOwn(shop, "passwordHash"), false);
});

test("repeated registration attempts eventually receive a rate-limit response", async () => {
  let rateLimited = false;

  for (let attempt = 0; attempt < 10 && !rateLimited; attempt += 1) {
    const response = await fetch(`${apiUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    rateLimited = response.status === 429;
  }

  assert.equal(rateLimited, true);
});
