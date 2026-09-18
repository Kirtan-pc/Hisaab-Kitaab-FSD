const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
require("dotenv").config({ path: "atlas-credentials.env" });

const shopRoutes = require("./routes/shopRoutes");
const productRoutes = require("./routes/productRoutes");
const customerRoutes = require("./routes/customerRoutes");
const orderRoutes = require("./routes/orderRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/shops", shopRoutes);
app.use("/api/products", productRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);

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

const mongoUri =
  process.env.MONGO_URI && !process.env.MONGO_URI.includes("<db_username>")
    ? process.env.MONGO_URI
    : process.env.MONGODB_URI;

if (mongoUri) {
  mongoose
    .connect(mongoUri, { serverSelectionTimeoutMS: 5000 })
    .then(() => {
      console.log("MongoDB Connected");
    })
    .catch((error) => {
      console.error("MongoDB Connection Error:", error.message);
    });
} else {
  console.warn("MONGO_URI is not configured; starting without MongoDB.");
}

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
