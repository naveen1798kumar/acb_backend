import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    mobile: { type: String, unique: true, sparse: true, default: null },
    email: {
      type: String,
      unique: true, // ✅ only unique when a value exists
      sparse: true, // ✅ allows multiple users without email
      lowercase: true,
      trim: true,
      default: null, // ✅ default is null, not empty string
    },
    password: {
      type: String,
      default: null,
      // optional: basic validator useful for admin/updates
      validate: {
        validator: function (v) {
          // only enforce length when authType is 'local' or when value exists
          if (this.authType === "local")
            return typeof v === "string" && v.length >= 6;
          if (v === null) return true;
          return typeof v === "string" && v.length >= 6;
        },
        message:
          "Password is required for local accounts and must be >= 6 chars",
      },
    },
    googleId: { type: String, sparse: true, default: null },
    authType: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    cart: { type: Array, default: [] },
    resetToken: { type: String },
    resetTokenExpires: { type: Date },
  },
  { timestamps: true }
);

// hash only when password present and modified
userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Ensures the sparse index is created correctly in case it was corrupted before
userSchema.index({ email: 1 }, { unique: true, sparse: true });
userSchema.index({ mobile: 1 }, { unique: true, sparse: true });

const User = mongoose.model("User", userSchema);
export default User;
