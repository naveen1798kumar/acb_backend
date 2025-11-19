import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

// 📦 Add new imports at the top if not already
import crypto from "crypto";
import { sendEmail } from "../utils/sendEmail.js";

import dotenv from "dotenv";
dotenv.config();

const JWT_SECRET =
  process.env.JWT_SECRET ||
  "9f1c2b5e4d6a7c8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

// 🧼 Helper to remove sensitive fields
const sanitizeUser = (userDoc) => {
  if (!userDoc) return null;
  const u = userDoc.toObject ? userDoc.toObject() : { ...userDoc };
  delete u.password;
  return u;
};

// 🔑 Token generator
const generateToken = (payload) => {
  try {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  } catch (err) {
    console.error("Token generation failed:", err);
    throw err;
  }
};

// ✅ User Registration
export const register = async (req, res) => {
  try {
    const { name, email, mobile, password } = req.body;

    // basic validation
    if (!name || !mobile)
      return res.status(400).json({ message: "Name and mobile required" });

    // if registering through local route, require password
    if (!password || password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password is required and must be >= 6 characters" });
    }

    // continue: check duplicates, create user
    // ensure authType = 'local'
    const user = await User.create({
      name,
      email: email || null,
      mobile,
      password,
      authType: "local",
    });
    // generate token, return success...
    const token = generateToken({ id: user._id });

    return res.status(201).json({
      success: true,
      token,
      user: sanitizeUser(user),
    });

  } catch (err) {
    // improved duplicate key handling
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue || {})[0] || "field";
      return res.status(409).json({ message: `${field} already exists` });
    }
    console.error("Register error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
};

// ✅ User Login
export const login = async (req, res) => {
  const { mobile, password } = req.body; // identifier = email or mobile

  const user = await User.findOne({
    $or: [{ email: mobile }, { mobile: mobile }],
  });

  if (!user) return res.status(401).json({ message: "Invalid credentials" });


  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json({ message: "Invalid credentials" });

  const token = generateToken({ id: user._id });

  res.json({ success: true, token, user: sanitizeUser(user) });
};

// ✅ Admin Login
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      email === process.env.ADMIN_EMAIL &&
      password === process.env.ADMIN_PASSWORD
    ) {
      const token = generateToken({ email, role: "admin" });
      return res.status(200).json({
        success: true,
        message: "Admin login successful",
        token,
      });
    } else {
      return res.status(401).json({ message: "Invalid admin credentials." });
    }
  } catch (err) {
    console.error("Admin login error:", err);
    res.status(500).json({ message: "Server error." });
  }
};

// ✅ Fetch All Users (Dashboard/Admin)
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 }).select("-password");
    res.status(200).json(users);
  } catch (err) {
    console.error("Get users error:", err);
    res.status(500).json({ message: "Failed to fetch users." });
  }
};

// ✅ Get Logged-in User Profile
export const getProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Not authenticated." });

    const user = await User.findById(userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found." });

    res.json({ success: true, user });
  } catch (err) {
    console.error("Get profile error:", err);
    res.status(500).json({ message: "Server error." });
  }
};

// ✅ Update Logged-in User Profile
// ✅ Forgot Password
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ message: "No user found with that email" });

    const resetToken = crypto.randomBytes(20).toString("hex");

    user.resetToken = resetToken;
    user.resetTokenExpires = Date.now() + 15 * 60 * 1000; // 15 mins
    await user.save();

    const frontendBase =
      process.env.NODE_ENV === "production"
        ? process.env.FRONTEND_URL
        : process.env.FRONTEND_URL_LOCAL;

    const resetLink = `${frontendBase}/reset-password/${resetToken}`;

    const html = `
      <h2>Password Reset Request</h2>
      <p>Click the link below to reset your password:</p>
      <a href="${resetLink}" target="_blank">${resetLink}</a>
      <p>This link expires in 15 minutes.</p>
    `;

    await sendEmail(user.email, "Reset Your Password - ACB Bakery", html);

    res.status(200).json({
      success: true,
      message: "Password reset link sent to your email",
    });
  } catch (err) {
    res.status(500).json({ message: "Error sending reset email" });
  }
};

// ✅ Reset Password
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!token || !password)
      return res
        .status(400)
        .json({ message: "Token and new password required" });

    const user = await User.findOne({
      resetToken: token,
      resetTokenExpires: { $gt: Date.now() },
    });

    if (!user)
      return res.status(400).json({ message: "Invalid or expired reset link" });

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.resetToken = undefined;
    user.resetTokenExpires = undefined;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Password has been reset successfully",
    });
  } catch (err) {
    console.error("Reset Password Error:", err);
    res.status(500).json({ message: "Error resetting password" });
  }
};
// ✅ Google OAuth Login/Register
// const existingEmail = await User.findOne({ email });
// if (existingEmail)
//   return res.status(400).json({ message: "Email already registered. Please login with Google." });
