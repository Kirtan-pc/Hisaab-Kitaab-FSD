const express = require("express");
const { body, param } = require("express-validator");
const Order = require("../models/Order");
const Customer = require("../models/Customer");
const Product = require("../models/Product");
const { requireAuth } = require("../middleware/authMiddleware");
const { allowOnly, validateRequest } = require("../middleware/validateRequest");

const router = express.Router();
const validStatuses = ["unconfirmed", "pending review", "paid", "unpaid"];
router.use(requireAuth);

async function orderReferencesBelongToShop(customerId, productId, shopId) {
  const [customer, product] = await Promise.all([
    customerId
      ? Customer.exists({ _id: customerId, shop: shopId })
      : Promise.resolve(true),
    productId
      ? Product.exists({ _id: productId, shop: shopId, active: true })
      : Promise.resolve(true),
  ]);
  return Boolean(customer && product);
}

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
      await Order.find({ shop: req.auth.shopId })
        .populate("customer", "name balance")
        .populate("product", "name")
        .sort({ orderedAt: -1 }),
    );
  },
);

router.post(
  "/",
  allowOnly([
    "customer",
    "product",
    "quantity",
    "price",
    "status",
    "source",
    "orderedAt",
  ]),
  [
    body("customer").isMongoId().withMessage("Choose a valid customer."),
    body("product").isMongoId().withMessage("Choose a valid product."),
    body("quantity")
      .isInt({ min: 1, max: 10000 })
      .withMessage("Quantity must be a whole number from 1 to 10000.")
      .toInt(),
    body("price")
      .optional({ nullable: true })
      .isFloat({ min: 0, max: 100000000 })
      .withMessage("Price must be zero or a positive amount.")
      .toFloat(),
    body("status")
      .optional()
      .isIn(validStatuses)
      .withMessage("Order status is invalid."),
    body("source")
      .optional()
      .isIn(["voice", "manual"])
      .withMessage("Order source must be voice or manual."),
    body("orderedAt")
      .optional()
      .isISO8601()
      .withMessage("Order date must be a valid ISO 8601 date.")
      .toDate(),
    validateRequest,
  ],
  async (req, res) => {
    const referencesBelongToShop = await orderReferencesBelongToShop(
      req.body.customer,
      req.body.product,
      req.auth.shopId,
    );
    if (!referencesBelongToShop) {
      return res.status(404).json({
        message: "Choose a customer and active product from your shop.",
      });
    }

    const order = await Order.create({
      ...req.body,
      shop: req.auth.shopId,
    });
    return res.status(201).json(order);
  },
);

router.patch(
  "/:id",
  allowOnly([
    "customer",
    "product",
    "quantity",
    "price",
    "status",
    "source",
    "orderedAt",
  ]),
  [
    param("id").isMongoId().withMessage("Order ID is invalid."),
    body("customer").optional().isMongoId().withMessage("Customer ID is invalid."),
    body("product").optional().isMongoId().withMessage("Product ID is invalid."),
    body("quantity")
      .optional()
      .isInt({ min: 1, max: 10000 })
      .withMessage("Quantity must be a whole number from 1 to 10000.")
      .toInt(),
    body("price")
      .optional({ nullable: true })
      .isFloat({ min: 0, max: 100000000 })
      .withMessage("Price must be zero or a positive amount.")
      .toFloat(),
    body("status")
      .optional()
      .isIn(validStatuses)
      .withMessage("Order status is invalid."),
    body("source")
      .optional()
      .isIn(["voice", "manual"])
      .withMessage("Order source must be voice or manual."),
    body("orderedAt")
      .optional()
      .isISO8601()
      .withMessage("Order date must be a valid ISO 8601 date.")
      .toDate(),
    body()
      .custom((_, { req }) => Object.keys(req.body).length > 0)
      .withMessage("Provide at least one order field to update."),
    validateRequest,
  ],
  async (req, res) => {
    const currentOrder = await Order.findOne({
      _id: req.params.id,
      shop: req.auth.shopId,
    });
    if (!currentOrder) return res.status(404).json({ message: "Order not found." });

    const customerId = req.body.customer ?? currentOrder.customer;
    const productId = req.body.product ?? currentOrder.product;
    if (
      !(await orderReferencesBelongToShop(
        customerId,
        productId,
        req.auth.shopId,
      ))
    ) {
      return res.status(404).json({
        message: "Choose a customer and active product from your shop.",
      });
    }

    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, shop: req.auth.shopId },
      req.body,
      { new: true, runValidators: true },
    );
    if (!order) return res.status(404).json({ message: "Order not found." });
    return res.json(order);
  },
);

router.delete(
  "/:id",
  [param("id").isMongoId().withMessage("Order ID is invalid."), validateRequest],
  async (req, res) => {
    const order = await Order.findOneAndDelete({
      _id: req.params.id,
      shop: req.auth.shopId,
    });
    if (!order) return res.status(404).json({ message: "Order not found." });
    return res.status(204).end();
  },
);

module.exports = router;
