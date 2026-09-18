const express = require("express");
const Payment = require("../models/Payment");

const router = express.Router();

router.get("/shop/:shopId", async (req, res) => {
  res.json(
    await Payment.find({ shop: req.params.shopId }).sort({ paidAt: -1 }),
  );
});

router.post("/", async (req, res) => {
  res.status(201).json(await Payment.create(req.body));
});

router.delete("/:id", async (req, res) => {
  const payment = await Payment.findByIdAndDelete(req.params.id);
  if (!payment) return res.status(404).json({ message: "Payment not found" });
  res.status(204).end();
});

module.exports = router;
