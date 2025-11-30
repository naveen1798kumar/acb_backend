import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import crypto from "crypto";
import { sendEmail } from "../utils/sendEmail.js";
import dotenv from "dotenv";
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

// ------------------------ TOKEN ------------------------
const generateToken = (payload) =>
  jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

// Remove password before sending response
const sanitizeUser = (userDoc) => {
  if (!userDoc) return null;
  const u = userDoc.toObject ? userDoc.toObject() : { ...userDoc };
  delete u.password;
  return u;
};

// ------------------------ USER REGISTER ------------------------
export const register = async (req, res) => {
  try {
    const { name, email, mobile, password } = req.body;

    if (!name || !mobile)
      return res.status(400).json({ message: "Name and mobile required" });

    if (!password || password.length < 6)
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });

    const user = await User.create({
      name,
      email,
      mobile,
      password,
      role: "user",
      authType: "local",
    });

    const token = generateToken({ id: user._id, role: "user" });

    return res.status(201).json({
      success: true,
      token,
      user: sanitizeUser(user),
    });
  } catch (err) {
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      return res.status(409).json({ message: `${field} already exists` });
    }
    res.status(500).json({ message: "Server error" });
  }
};

// ------------------------ USER LOGIN ------------------------
export const login = async (req, res) => {
  const { mobile, password } = req.body;

  const user = await User.findOne({
    $or: [{ email: mobile }, { mobile }],
  });

  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json({ message: "Invalid credentials" });

  const token = generateToken({ id: user._id, role: user.role });

  res.json({ success: true, token, user: sanitizeUser(user) });
};

// ------------------------ ADMIN LOGIN ------------------------
export const adminLogin = async (req, res) => {
  const { email, password } = req.body;

  if (
    email === process.env.ADMIN_EMAIL &&
    password === process.env.ADMIN_PASSWORD
  ) {
    const token = generateToken({ email, role: "admin" });

    return res.json({
      success: true,
      token,
      message: "Admin login success",
    });
  }

  return res.status(401).json({ message: "Invalid admin credentials" });
};

// ------------------------ ADMIN: GET ALL USERS ------------------------
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 }).select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch users" });
  }
};

// ------------------------ USER PROFILE ------------------------
export const getProfile = async (req, res) => {
  try {
    if (!req.user?.id)
      return res.status(401).json({ message: "Not authenticated" });

    const user = await User.findById(req.user.id).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// ------------------------ FORGOT PASSWORD (KEEP) ------------------------
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) return res.status(400).json({ message: "Email required" });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ message: "User not found" });

    const resetToken = crypto.randomBytes(20).toString("hex");

    user.resetToken = resetToken;
    user.resetTokenExpires = Date.now() + 15 * 60 * 1000;
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

    res.json({
      success: true,
      message: "Password reset link sent to your email",
    });
  } catch (err) {
    res.status(500).json({ message: "Error sending reset email" });
  }
};

// ------------------------ RESET PASSWORD (KEEP) ------------------------
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const user = await User.findOne({
      resetToken: token,
      resetTokenExpires: { $gt: Date.now() },
    });

    if (!user)
      return res
        .status(400)
        .json({ message: "Invalid or expired reset link" });

    const hashed = await bcrypt.hash(password, 10);

    user.password = hashed;
    user.resetToken = undefined;
    user.resetTokenExpires = undefined;

    await user.save();

    res.json({
      success: true,
      message: "Password reset successful",
    });
  } catch (err) {
    res.status(500).json({ message: "Error resetting password" });
  }
};
