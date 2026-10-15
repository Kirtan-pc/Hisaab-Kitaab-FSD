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

function createAccessToken(shopId, role = "user") {
  if (!["user", "admin"].includes(role)) {
    throw new Error("A valid account role is required to create an access token.");
  }

  return jwt.sign({ role }, getJwtSecret(), {
    algorithm: "HS256",
    subject: String(shopId),
    issuer: TOKEN_ISSUER,
    audience: TOKEN_AUDIENCE,
    expiresIn: "1h",
  });
}

function requireAuth(req, res, next) {
  const authorization = req.get("authorization");
  const match = authorization?.match(/^Bearer\s+(\S+)$/i);

  if (!match) {
    return res.status(401).json({ message: "A valid bearer token is required." });
  }

  try {
    const [, token] = match;
    const payload = jwt.verify(token, getJwtSecret(), {
      algorithms: ["HS256"],
      issuer: TOKEN_ISSUER,
      audience: TOKEN_AUDIENCE,
    });

    if (
      typeof payload === "string" ||
      typeof payload.sub !== "string" ||
      !mongoose.isValidObjectId(payload.sub) ||
      !["user", "admin"].includes(payload.role ?? "user")
    ) {
      return res.status(401).json({ message: "The access token is invalid." });
    }

    req.auth = { shopId: payload.sub, role: payload.role ?? "user" };
    return next();
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError" ||
      error.name === "NotBeforeError"
    ) {
      return res.status(401).json({ message: "The access token is invalid or expired." });
    }
    return next(error);
  }
}

function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.auth) {
      return res.status(401).json({ message: "Authentication is required." });
    }

    if (!allowedRoles.includes(req.auth.role)) {
      return res.status(403).json({ message: "You do not have permission to access this resource." });
    }

    return next();
  };
}

module.exports = { authorizeRoles, createAccessToken, requireAuth };
