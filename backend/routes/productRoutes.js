const express = require("express");
const Product = require("../models/Product");

const router = express.Router();

router.get("/shop/:shopId", async (req, res) => {
  res.json(await Product.find({ shop: req.params.shopId }));
});

router.post("/", async (req, res) => {
  const product = await Product.create({
    ...req.body,
    normalizedName: req.body.name?.trim().toLowerCase(),
  });
  res.status(201).json(product);
});

router.patch("/:id", async (req, res) => {
  const updates = { ...req.body };
  if (updates.name) updates.normalizedName = updates.name.trim().toLowerCase();
  const product = await Product.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });
  if (!product) return res.status(404).json({ message: "Product not found" });
  res.json(product);
});

router.delete("/:id", async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) return res.status(404).json({ message: "Product not found" });
  res.status(204).end();
});

module.exports = router;
