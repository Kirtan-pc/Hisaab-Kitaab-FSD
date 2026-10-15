const express = require("express");
const bcrypt = require("bcryptjs");
const { body } = require("express-validator");
const { rateLimit } = require("express-rate-limit");
const Shop = require("../models/Shop");
const { createAccessToken } = require("../middleware/authMiddleware");
const { allowOnly, validateRequest } = require("../middleware/validateRequest");

const router = express.Router();
const phonePattern = /^\+?[1-9]\d{7,14}$/;

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many sign-in attempts. Please try again later." },
});

function authResponse(shop) {
  return {
    token: createAccessToken(shop._id),
    shop: {
      id: String(shop._id),
      name: shop.name,
      ownerPhone: shop.ownerPhone,
    },
  };
}

router.post(
  "/register",
  authLimiter,
  allowOnly(["name", "ownerPhone", "password"]),
  [
    body("name")
      .isString()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage("Shop name must be between 1 and 100 characters."),
    body("ownerPhone")
      .isString()
      .trim()
      .matches(phonePattern)
      .withMessage("Enter a valid phone number, including country code if needed."),
    body("password")
      .isString()
      .bail()
      .isLength({ min: 12, max: 72 })
      .withMessage("Password must contain at least 12 characters.")
      .bail()
      .custom((password) => Buffer.byteLength(password, "utf8") <= 72)
      .withMessage("Password must contain 12 to 72 UTF-8 bytes."),
    validateRequest,
  ],
  async (req, res) => {
    const passwordHash = await bcrypt.hash(req.body.password, 12);
    const shop = await Shop.create({
      name: req.body.name,
      ownerPhone: req.body.ownerPhone,
      passwordHash,
    });

    return res.status(201).json(authResponse(shop));
  },
);

router.post(
  "/login",
  authLimiter,
  allowOnly(["ownerPhone", "password"]),
  [
    body("ownerPhone")
      .isString()
      .trim()
      .matches(phonePattern)
      .withMessage("Enter a valid phone number."),
    body("password")
      .isString()
      .bail()
      .notEmpty()
      .withMessage("Password is required.")
      .bail()
      .custom((password) => Buffer.byteLength(password, "utf8") <= 72)
      .withMessage("Password must not exceed 72 UTF-8 bytes."),
    validateRequest,
  ],
  async (req, res) => {
    const shop = await Shop.findOne({ ownerPhone: req.body.ownerPhone }).select(
      "+passwordHash",
    );
    const passwordMatches = shop
      ? await bcrypt.compare(req.body.password, shop.passwordHash)
      : false;

    if (!shop || !passwordMatches) {
      return res.status(401).json({ message: "Phone number or password is incorrect." });
    }

    return res.json(authResponse(shop));
  },
);

module.exports = router;
