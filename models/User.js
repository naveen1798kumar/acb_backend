import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    mobile: { type: String, unique: true, default: null },
    email: {
      type: String,
      unique: true,   // ✅ only unique when a value exists
      sparse: true,   // ✅ allows multiple users without email
      lowercase: true,
      trim: true,
      default: null,  // ✅ default is null, not empty string
    },
    password: { type: String, required: true },
    cart: { type: Array, default: [] },
    resetToken: { type: String },
    resetTokenExpires: { type: Date },
  },
  { timestamps: true }
);

// Ensures the sparse index is created correctly in case it was corrupted before
userSchema.index({ email: 1 }, { unique: true, sparse: true });

const User = mongoose.model("User", userSchema);
export default User;
