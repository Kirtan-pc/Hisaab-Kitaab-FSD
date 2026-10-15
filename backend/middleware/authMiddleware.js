const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const TOKEN_ISSUER = "hisaab-kitaab-api";
const TOKEN_AUDIENCE = "hisaab-kitaab-client";

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET must contain at least 32 characters.");
  }
  return secret;
}

function createAccessToken(shopId) {
  return jwt.sign({}, getJwtSecret(), {
    algorithm: "HS256",
    subject: String(shopId),
    issuer: TOKEN_ISSUER,
    audience: TOKEN_AUDIENCE,
    expiresIn: "1h",
  });
}

function requireAuth(req, res, next) {
  const authorization = req.get("authorization");
  const [scheme, token] = authorization?.split(" ") ?? [];

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ message: "A valid bearer token is required." });
  }

  try {
    const payload = jwt.verify(token, getJwtSecret(), {
      algorithms: ["HS256"],
      issuer: TOKEN_ISSUER,
      audience: TOKEN_AUDIENCE,
    });

    if (
      typeof payload === "string" ||
      typeof payload.sub !== "string" ||
      !mongoose.isValidObjectId(payload.sub)
    ) {
      return res.status(401).json({ message: "The access token is invalid." });
    }

    req.auth = { shopId: payload.sub };
    return next();
  } catch (error) {
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "The access token is invalid or expired." });
    }
    return next(error);
  }
}

module.exports = { createAccessToken, requireAuth };
