const mongoose = require("mongoose");

const shopSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    ownerPhone: { type: String, required: true, unique: true, trim: true },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      unique: true,
      sparse: true,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
      required: true,
    },
    passwordHash: { type: String, required: true, select: false },
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
  },
  { timestamps: true },
);

shopSchema.set("toJSON", {
  transform: (_document, shop) => {
    delete shop.passwordHash;
    delete shop.__v;
    return shop;
  },
});

module.exports = mongoose.model("Shop", shopSchema);
