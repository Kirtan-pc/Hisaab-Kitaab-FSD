const express = require("express");
const Customer = require("../models/Customer");
const Order = require("../models/Order");

const router = express.Router();

router.get("/shop/:shopId", async (req, res) => {
  res.json(await Customer.find({ shop: req.params.shopId }).sort({ name: 1 }));
});

router.post("/", async (req, res) => {
  res.status(201).json(await Customer.create(req.body));
});

router.patch("/:id", async (req, res) => {
  const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!customer) return res.status(404).json({ message: "Customer not found" });
  res.json(customer);
});

router.post("/:sourceId/merge/:targetId", async (req, res) => {
  const source = await Customer.findById(req.params.sourceId);
  const target = await Customer.findById(req.params.targetId);
  if (!source || !target)
    return res.status(404).json({ message: "Customer not found" });
  if (String(source.shop) !== String(target.shop)) {
    return res
      .status(400)
      .json({ message: "Customers must belong to the same shop" });
  }

  await Order.updateMany({ customer: source._id }, { customer: target._id });
  target.balance += source.balance;
  await target.save();
  await source.deleteOne();
  res.json(target);
});

module.exports = router;
