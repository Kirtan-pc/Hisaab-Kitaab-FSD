const express = require("express");
const { body, param } = require("express-validator");
const Customer = require("../models/Customer");
const Order = require("../models/Order");
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
      await Customer.find({ shop: req.auth.shopId }).sort({ name: 1 }),
    );
  },
);

router.post(
  "/",
  allowOnly(["name"]),
  [
    body("name")
      .isString()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage("Customer name must be between 1 and 100 characters."),
    validateRequest,
  ],
  async (req, res) => {
    const customer = await Customer.create({
      shop: req.auth.shopId,
      name: req.body.name,
    });
    return res.status(201).json(customer);
  },
);

router.patch(
  "/:id",
  allowOnly(["name"]),
  [
    param("id").isMongoId().withMessage("Customer ID is invalid."),
    body("name")
      .isString()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage("Customer name must be between 1 and 100 characters."),
    validateRequest,
  ],
  async (req, res) => {
    const customer = await Customer.findOneAndUpdate(
      { _id: req.params.id, shop: req.auth.shopId },
      { name: req.body.name },
      { new: true, runValidators: true },
    );
    if (!customer) return res.status(404).json({ message: "Customer not found." });
    return res.json(customer);
  },
);

router.post(
  "/:sourceId/merge/:targetId",
  [
    param("sourceId").isMongoId().withMessage("Source customer ID is invalid."),
    param("targetId").isMongoId().withMessage("Target customer ID is invalid."),
    validateRequest,
  ],
  async (req, res) => {
    if (req.params.sourceId === req.params.targetId) {
      return res.status(400).json({ message: "Choose two different customers." });
    }

    const [source, target] = await Promise.all([
      Customer.findOne({ _id: req.params.sourceId, shop: req.auth.shopId }),
      Customer.findOne({ _id: req.params.targetId, shop: req.auth.shopId }),
    ]);
    if (!source || !target) {
      return res.status(404).json({ message: "Customer not found." });
    }

    await Order.updateMany(
      { customer: source._id, shop: req.auth.shopId },
      { customer: target._id },
    );
    target.balance += source.balance;
    await target.save();
    await source.deleteOne();
    return res.json(target);
  },
);

module.exports = router;
