const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    shop: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true },
    name: { type: String, required: true, trim: true },
    normalizedName: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

productSchema.index({ shop: 1, normalizedName: 1 }, { unique: true });

module.exports = mongoose.model("Product", productSchema);
