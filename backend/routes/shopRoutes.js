const express = require("express");
const Shop = require("../models/Shop");

const router = express.Router();

router.get("/", async (_req, res) => {
  res.json(await Shop.find().populate("products"));
});

router.get("/:id", async (req, res) => {
  const shop = await Shop.findById(req.params.id).populate("products");
  if (!shop) return res.status(404).json({ message: "Shop not found" });
  res.json(shop);
});

router.post("/", async (req, res) => {
  const shop = await Shop.create(req.body);
  res.status(201).json(shop);
});

router.patch("/:id", async (req, res) => {
  const shop = await Shop.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!shop) return res.status(404).json({ message: "Shop not found" });
  res.json(shop);
});

router.delete("/:id", async (req, res) => {
  const shop = await Shop.findByIdAndDelete(req.params.id);
  if (!shop) return res.status(404).json({ message: "Shop not found" });
  res.status(204).end();
});

module.exports = router;
