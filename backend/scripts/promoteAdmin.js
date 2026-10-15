const path = require("node:path");
const mongoose = require("mongoose");
const Shop = require("../models/Shop");

require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

async function promoteAdministrator() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error("Provide the email address of an existing account.");
    process.exitCode = 1;
    return;
  }

  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!mongoUri || mongoUri.includes("<db_username>")) {
    console.error("Set a valid MONGO_URI in backend/.env before promoting an administrator.");
    process.exitCode = 1;
    return;
  }

  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
    const shop = await Shop.findOneAndUpdate(
      { email },
      { role: "admin" },
      { new: true, runValidators: true },
    ).select("email role");

    if (!shop) {
      console.error("No account was found for that email address.");
      process.exitCode = 1;
      return;
    }

    console.log(`Administrator role assigned to ${shop.email}. Sign in again to receive an updated token.`);
  } catch {
    console.error("Administrator promotion failed. Check the MongoDB connection and try again.");
    process.exitCode = 1;
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
}

promoteAdministrator();
