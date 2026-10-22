const assert = require("node:assert/strict");
const http = require("node:http");
const { once } = require("node:events");
const { after, before, test } = require("node:test");
const { io: connectSocket } = require("socket.io-client");

process.env.JWT_SECRET = "test-only-secret-that-is-at-least-32-characters";
const { app } = require("../server");
const { createAccessToken } = require("../middleware/authMiddleware");
const { createSocketServer } = require("../socket");

const firstShop = "507f1f77bcf86cd799439011";
let server;
let io;
let socketUrl;
const clients = [];

before(async () => {
  server = http.createServer(app);
  io = createSocketServer(server, ["http://localhost:5173"]);
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  socketUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  clients.forEach((client) => client.disconnect());
  await new Promise((resolve) => io.close(resolve));
});

function connect(token, origin) {
  return new Promise((resolve, reject) => {
    const client = connectSocket(socketUrl, {
      auth: { token },
      extraHeaders: origin ? { Origin: origin } : undefined,
      reconnection: false,
      timeout: 1000,
    });
    clients.push(client);
    client.once("connect", () => resolve(client));
    client.once("connect_error", reject);
  });
}

function send(client, payload) {
  return new Promise((resolve) => {
    client.emit("chatMessage", payload, resolve);
  });
}

test("Socket.IO rejects connections without a valid JWT", async () => {
  await assert.rejects(connect("invalid-token"), /Authentication required/);
});

test("Socket.IO rejects origins outside the configured allowlist", async () => {
  await assert.rejects(
    connect(createAccessToken(firstShop), "https://untrusted.example"),
  );
});

test("authenticated clients receive messages only in their shop room", async () => {
  const first = await connect(createAccessToken(firstShop));
  const sameShop = await connect(createAccessToken(firstShop));
  const otherShop = await connect(
    createAccessToken("507f191e810c19729de860ea"),
  );
  const received = new Promise((resolve) =>
    sameShop.once("chatMessage", resolve),
  );
  let otherShopReceived = false;
  otherShop.on("chatMessage", () => {
    otherShopReceived = true;
  });

  const acknowledgement = await send(first, { text: "Hello from another tab" });
  const message = await received;

  assert.deepEqual(acknowledgement, { ok: true });
  assert.equal(message.text, "Hello from another tab");
  assert.equal(message.senderId, firstShop);
  assert.equal(typeof message.timestamp, "string");
  assert.equal(otherShopReceived, false);
});

test("empty, malformed, and overlong messages are rejected", async () => {
  const sender = await connect(createAccessToken(firstShop));
  let broadcastCount = 0;
  sender.on("chatMessage", () => {
    broadcastCount += 1;
  });

  assert.match((await send(sender, { text: "  " })).error, /1 to 500/);
  assert.match((await send(sender, "not an object")).error, /1 to 500/);
  assert.match((await send(sender, { text: "x".repeat(501) })).error, /1 to 500/);
  assert.equal(broadcastCount, 0);
});

test("message rate is limited per connection", async () => {
  const sender = await connect(createAccessToken(firstShop));

  for (let message = 0; message < 5; message += 1) {
    assert.deepEqual(await send(sender, { text: "A valid message" }), {
      ok: true,
    });
  }
  assert.match(
    (await send(sender, { text: "One message too many" })).error,
    /wait before sending/,
  );
});
