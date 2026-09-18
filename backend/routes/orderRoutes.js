const express = require("express");
const Order = require("../models/Order");

const router = express.Router();

router.get("/shop/:shopId", async (req, res) => {
  res.json(
    await Order.find({ shop: req.params.shopId })
      .populate("customer", "name balance")
      .populate("product", "name")
      .sort({ orderedAt: -1 }),
  );
});

router.post("/", async (req, res) => {
  res.status(201).json(await Order.create(req.body));
});

router.patch("/:id", async (req, res) => {
  const order = await Order.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!order) return res.status(404).json({ message: "Order not found" });
  res.json(order);
});

router.delete("/:id", async (req, res) => {
  const order = await Order.findByIdAndDelete(req.params.id);
  if (!order) return res.status(404).json({ message: "Order not found" });
  res.status(204).end();
});

module.exports = router;
