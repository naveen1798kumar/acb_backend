import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },

    mobile: { type: String, unique: true, sparse: true, default: null },

    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
      default: null,
    },

    password: {
      type: String,
      default: null,
      validate: {
        validator: function (v) {
          // ✅ Only enforce password rules for local users
          if (this.authType === "google") return true;
          if (!v) return false;
          return typeof v === "string" && v.length >= 6;
        },
        message: "Password is required for local accounts and must be >= 6 characters.",
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

// ✅ Hash only when password is present and modified
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

// ✅ Keep sparse unique indexes
userSchema.index({ email: 1 }, { unique: true, sparse: true });
userSchema.index({ mobile: 1 }, { unique: true, sparse: true });

const User = mongoose.model("User", userSchema);
export default User;
