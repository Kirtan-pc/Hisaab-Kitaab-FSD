const mongoose = require("mongoose");

const shopSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    ownerPhone: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: true },
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
  },
  { timestamps: true },
);

module.exports = mongoose.model("Shop", shopSchema);
