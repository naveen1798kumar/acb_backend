// models/User.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const cartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    qty: {
      type: Number,
      required: true,
      default: 1,
    },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, required: true, },

    email: { type: String, trim: true, lowercase: true, sparse: true, unique: false, },

    mobile: { type: String, trim: true, sparse: true, },

    password: { type: String, minlength: 6, },

    googleId: { type: String, sparse: true, },

    authType: { type: String, enum: ["local", "google"],
      default: "local", },

    resetToken: String,
    resetTokenExpires: Date,

    cart: [cartItemSchema],

    role: { type: String, enum: ["user", "admin"], default: "user", },
  },
  {
    timestamps: true,
  }
);

// ✅ Password hashing middleware
userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ✅ Compare password method
userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

// ✅ Prevent duplicate mobile for local users only
userSchema.pre("save", async function (next) {
  if (this.authType === "local" && this.mobile) {
    const existingUser = await mongoose.models.User.findOne({
      mobile: this.mobile,
      _id: { $ne: this._id },
    });
    if (existingUser) {
      const err = new Error("Mobile number already in use");
      err.statusCode = 400;
      return next(err);
    }
  }
  next();
});

const User = mongoose.model("User", userSchema);

export default User;
