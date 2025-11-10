import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";

dotenv.config();

const fixOAuthUsers = async () => {
  try {
    console.log("🔄 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/acbdashboard");
    console.log("✅ Connected to MongoDB");

    // Find and fix users with placeholder values
    const result = await User.updateMany(
      {
        $or: [
          { mobile: "google_user" },
          { password: "google_oauth_user" },
          { authType: { $exists: false }, googleId: { $exists: true } }
        ]
      },
      {
        $set: {
          mobile: null,
          password: null,
          authType: "google"
        }
      }
    );

    console.log("🔨 Migration results:");
    console.log(`- Modified ${result.modifiedCount} users`);
    console.log(`- Matched ${result.matchedCount} users`);

  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }

  process.exit(0);
};

fixOAuthUsers();