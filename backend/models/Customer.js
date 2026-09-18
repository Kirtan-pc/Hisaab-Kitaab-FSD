const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    shop: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true },
    name: { type: String, required: true, trim: true },
    balance: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

customerSchema.index({ shop: 1, name: 1 });

module.exports = mongoose.model("Customer", customerSchema);
