const express = require("express");
const { body, param } = require("express-validator");
const Shop = require("../models/Shop");
const { requireAuth } = require("../middleware/authMiddleware");
const { allowOnly, validateRequest } = require("../middleware/validateRequest");

const router = express.Router();

router.use(requireAuth);

async function getOwnShop(shopId) {
  return Shop.findById(shopId)
    .select("name ownerPhone products createdAt updatedAt")
    .populate("products");
}

router.get("/", async (req, res) => {
  const shop = await getOwnShop(req.auth.shopId);
  if (!shop) return res.status(404).json({ message: "Shop not found." });
  return res.json(shop);
});

router.get(
  "/:id",
  [param("id").isMongoId().withMessage("Shop ID is invalid."), validateRequest],
  async (req, res) => {
    if (req.params.id.toLowerCase() !== req.auth.shopId.toLowerCase()) {
      return res.status(404).json({ message: "Shop not found." });
    }

    const shop = await getOwnShop(req.auth.shopId);
    if (!shop) return res.status(404).json({ message: "Shop not found." });
    return res.json(shop);
  },
);

router.patch(
  "/:id",
  allowOnly(["name"]),
  [
    param("id").isMongoId().withMessage("Shop ID is invalid."),
    body("name")
      .isString()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage("Shop name must be between 1 and 100 characters."),
    validateRequest,
  ],
  async (req, res) => {
    if (req.params.id.toLowerCase() !== req.auth.shopId.toLowerCase()) {
      return res.status(404).json({ message: "Shop not found." });
    }

    const shop = await Shop.findByIdAndUpdate(
      req.auth.shopId,
      { name: req.body.name },
      { new: true, runValidators: true },
    ).select("name ownerPhone products createdAt updatedAt");

    if (!shop) return res.status(404).json({ message: "Shop not found." });
    return res.json(shop);
  },
);

module.exports = router;
