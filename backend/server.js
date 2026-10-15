const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const { rateLimit } = require("express-rate-limit");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const shopRoutes = require("./routes/shopRoutes");
const productRoutes = require("./routes/productRoutes");
const customerRoutes = require("./routes/customerRoutes");
const orderRoutes = require("./routes/orderRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const { errorHandler, notFound } = require("./middleware/errorMiddleware");
const {
  authorizeRoles,
  requireAuth,
} = require("./middleware/authMiddleware");

const app = express();
app.disable("x-powered-by");

const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      const error = new Error("Origin is not allowed.");
      error.status = 403;
      return callback(error);
    },
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json({ limit: "10kb" }));

app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many requests. Please try again later." },
  }),
);

app.use("/api/auth", authRoutes);
app.use("/api/shops", shopRoutes);
app.use("/api/products", productRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);

app.get("/api/protected", requireAuth, (req, res) => {
  return res.json({
    message: "You are authenticated.",
    account: { id: req.auth.shopId, role: req.auth.role },
  });
});

app.get("/api/admin", requireAuth, authorizeRoles("admin"), (req, res) => {
  return res.json({
    message: "Administrator access granted.",
    account: { id: req.auth.shopId, role: req.auth.role },
  });
});

app.get("/", (req, res) => {
  res.send("Hisaab Kitaab API is Running");
});

app.get("/api/health", (req, res) => {
  res.json({
    service: "hisaab-kitaab-api",
    status: "ok",
    database:
      mongoose.connection.readyState === 1 ? "connected" : "unavailable",
  });
});

app.use(notFound);
app.use(errorHandler);

async function startServer() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET must contain at least 32 characters.");
  }

  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!mongoUri || mongoUri.includes("<db_username>")) {
    throw new Error("Set a valid MONGO_URI in backend/.env before starting.");
  }

  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });

  const port = process.env.PORT || 5000;
  return app.listen(port, () => {
    console.log(`Hisaab Kitaab API listening on port ${port}`);
  });
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error(`Server startup failed: ${error.message}`);
    process.exitCode = 1;
  });
}

module.exports = { app, startServer };
