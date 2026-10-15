const express = require("express");
const { body, param } = require("express-validator");
const Product = require("../models/Product");
const Shop = require("../models/Shop");
const { requireAuth } = require("../middleware/authMiddleware");
const { allowOnly, validateRequest } = require("../middleware/validateRequest");

const router = express.Router();
const shopPath = param("shopId").isMongoId().withMessage("Shop ID is invalid.");
router.use(requireAuth);

router.get(
  "/shop/:shopId",
  [shopPath, validateRequest],
  async (req, res) => {
    if (req.params.shopId.toLowerCase() !== req.auth.shopId.toLowerCase()) {
      return res.status(404).json({ message: "Shop not found." });
    }
    return res.json(await Product.find({ shop: req.auth.shopId }).sort({ name: 1 }));
  },
);

router.post(
  "/",
  allowOnly(["name", "active"]),
  [
    body("name")
      .isString()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage("Product name must be between 1 and 100 characters."),
    body("active")
      .optional()
      .isBoolean()
      .withMessage("Active must be true or false.")
      .toBoolean(),
    validateRequest,
  ],
  async (req, res) => {
    const product = await Product.create({
      shop: req.auth.shopId,
      name: req.body.name,
      normalizedName: req.body.name.toLowerCase(),
      ...(req.body.active === undefined ? {} : { active: req.body.active }),
    });

    await Shop.findByIdAndUpdate(req.auth.shopId, {
      $addToSet: { products: product._id },
    });
    return res.status(201).json(product);
  },
);

router.patch(
  "/:id",
  allowOnly(["name", "active"]),
  [
    param("id").isMongoId().withMessage("Product ID is invalid."),
    body("name")
      .optional()
      .isString()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage("Product name must be between 1 and 100 characters."),
    body("active")
      .optional()
      .isBoolean()
      .withMessage("Active must be true or false.")
      .toBoolean(),
    body()
      .custom((_, { req }) => Object.keys(req.body).length > 0)
      .withMessage("Provide at least one product field to update."),
    validateRequest,
  ],
  async (req, res) => {
    const updates = {};
    if (req.body.name !== undefined) {
      updates.name = req.body.name;
      updates.normalizedName = req.body.name.toLowerCase();
    }
    if (req.body.active !== undefined) updates.active = req.body.active;

    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, shop: req.auth.shopId },
      updates,
      { new: true, runValidators: true },
    );
    if (!product) return res.status(404).json({ message: "Product not found." });
    return res.json(product);
  },
);

router.delete(
  "/:id",
  [param("id").isMongoId().withMessage("Product ID is invalid."), validateRequest],
  async (req, res) => {
    const product = await Product.findOneAndDelete({
      _id: req.params.id,
      shop: req.auth.shopId,
    });
    if (!product) return res.status(404).json({ message: "Product not found." });

    await Shop.findByIdAndUpdate(req.auth.shopId, {
      $pull: { products: product._id },
    });
    return res.status(204).end();
  },
);

module.exports = router;
