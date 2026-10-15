const express = require("express");
const { body, param } = require("express-validator");
const Payment = require("../models/Payment");
const Customer = require("../models/Customer");
const { requireAuth } = require("../middleware/authMiddleware");
const { allowOnly, validateRequest } = require("../middleware/validateRequest");

const router = express.Router();
router.use(requireAuth);

router.get(
  "/shop/:shopId",
  [
    param("shopId").isMongoId().withMessage("Shop ID is invalid."),
    validateRequest,
  ],
  async (req, res) => {
    if (req.params.shopId.toLowerCase() !== req.auth.shopId.toLowerCase()) {
      return res.status(404).json({ message: "Shop not found." });
    }
    return res.json(
      await Payment.find({ shop: req.auth.shopId }).sort({ paidAt: -1 }),
    );
  },
);

router.post(
  "/",
  allowOnly(["customer", "amount", "paidAt"]),
  [
    body("customer").isMongoId().withMessage("Choose a valid customer."),
    body("amount")
      .isFloat({ gt: 0, max: 100000000 })
      .withMessage("Payment amount must be greater than zero.")
      .toFloat(),
    body("paidAt")
      .optional()
      .isISO8601()
      .withMessage("Payment date must be a valid ISO 8601 date.")
      .toDate(),
    validateRequest,
  ],
  async (req, res) => {
    const customer = await Customer.exists({
      _id: req.body.customer,
      shop: req.auth.shopId,
    });
    if (!customer) {
      return res.status(404).json({ message: "Customer not found." });
    }

    const payment = await Payment.create({
      ...req.body,
      shop: req.auth.shopId,
    });
    return res.status(201).json(payment);
  },
);

router.delete(
  "/:id",
  [param("id").isMongoId().withMessage("Payment ID is invalid."), validateRequest],
  async (req, res) => {
    const payment = await Payment.findOneAndDelete({
      _id: req.params.id,
      shop: req.auth.shopId,
    });
    if (!payment) return res.status(404).json({ message: "Payment not found." });
    return res.status(204).end();
  },
);

module.exports = router;
