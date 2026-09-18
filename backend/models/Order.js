const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    shop: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, default: null, min: 0 },
    status: {
      type: String,
      enum: ["unconfirmed", "pending review", "paid", "unpaid"],
      default: "pending review",
    },
    source: { type: String, enum: ["voice", "manual"], default: "manual" },
    orderedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Order", orderSchema);
