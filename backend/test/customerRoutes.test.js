const assert = require("node:assert/strict");
const { once } = require("node:events");
const { after, before, test } = require("node:test");
const Customer = require("../models/Customer");
const Order = require("../models/Order");

process.env.JWT_SECRET = "test-only-secret-that-is-at-least-32-characters";
const { app } = require("../server");
const { createAccessToken } = require("../middleware/authMiddleware");

const shopId = "507f1f77bcf86cd799439011";
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

test("customer merge rejects the same ObjectId with different casing", async (t) => {
  let customerLookups = 0;
  let orderUpdates = 0;
  const sameCustomer = {
    _id: shopId,
    balance: 25,
    save: async () => {},
    deleteOne: async () => {},
  };
  t.mock.method(Customer, "findOne", async () => {
    customerLookups += 1;
    return sameCustomer;
  });
  t.mock.method(Order, "updateMany", async () => {
    orderUpdates += 1;
  });

  const response = await fetch(
    `${apiUrl}/api/customers/${shopId.toLowerCase()}/merge/${shopId.toUpperCase()}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${createAccessToken(shopId)}`,
      },
    },
  );

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    message: "Choose two different customers.",
  });
  assert.equal(customerLookups, 0);
  assert.equal(orderUpdates, 0);
});
