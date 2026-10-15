const express = require("express");
const bcrypt = require("bcryptjs");
const { body } = require("express-validator");
const { rateLimit } = require("express-rate-limit");
const Shop = require("../models/Shop");
const {
  createAccessToken,
  requireAuth,
} = require("../middleware/authMiddleware");
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
  const role = shop.role ?? "user";

  return {
    token: createAccessToken(shop._id, role),
    shop: {
      id: String(shop._id),
      name: shop.name,
      email: shop.email,
      ownerPhone: shop.ownerPhone,
      role,
    },
  };
}

router.post(
  "/register",
  authLimiter,
  allowOnly(["name", "email", "ownerPhone", "password"]),
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
    body("email")
      .isString()
      .bail()
      .trim()
      .isEmail()
      .withMessage("Enter a valid email address.")
      .bail()
      .customSanitizer((email) => email.toLowerCase()),
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
  async (req, res, next) => {
    try {
      const passwordHash = await bcrypt.hash(req.body.password, 12);
      // Public signup always creates an ordinary account; role is never copied
      // from the request, even if a future allowlist change accepts that field.
      const shop = await Shop.create({
        name: req.body.name,
        email: req.body.email,
        ownerPhone: req.body.ownerPhone,
        passwordHash,
        role: "user",
      });

      return res.status(201).json(authResponse(shop));
    } catch (error) {
      return next(error);
    }
  },
);

router.post(
  "/login",
  authLimiter,
  allowOnly(["email", "ownerPhone", "password"]),
  [
    body("email")
      .optional()
      .isString()
      .bail()
      .trim()
      .isEmail()
      .withMessage("Enter a valid email address.")
      .bail()
      .customSanitizer((email) => email.toLowerCase()),
    body("ownerPhone")
      .optional()
      .isString()
      .bail()
      .trim()
      .matches(phonePattern)
      .withMessage("Enter a valid phone number."),
    body()
      .custom((_, { req }) => Boolean(req.body.email) !== Boolean(req.body.ownerPhone))
      .withMessage("Provide either an email address or a phone number."),
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
  async (req, res, next) => {
    try {
      const accountField = req.body.email
        ? { email: req.body.email }
        : { ownerPhone: req.body.ownerPhone };
      const shop = await Shop.findOne(accountField).select("+passwordHash");
      const passwordMatches = shop
        ? await bcrypt.compare(req.body.password, shop.passwordHash)
        : false;

      if (!shop || !passwordMatches) {
        return res
          .status(401)
          .json({ message: "Email/phone or password is incorrect." });
      }

      return res.json(authResponse(shop));
    } catch (error) {
      return next(error);
    }
  },
);

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const shop = await Shop.findById(req.auth.shopId).select(
      "name email ownerPhone role",
    );
    if (!shop) return res.status(404).json({ message: "Account not found." });

    return res.json({
      id: String(shop._id),
      name: shop.name,
      email: shop.email,
      ownerPhone: shop.ownerPhone,
      role: shop.role ?? "user",
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
