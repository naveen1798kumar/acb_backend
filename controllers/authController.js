import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import dotenv from "dotenv";
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

// 🧠 Generate JWT Token
const generateToken = (payload) =>
  jwt.sign(payload, JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

// ✅ User Registration
export const register = async (req, res) => {
  try {
    const { name, mobile, email, password } = req.body;

    if (!name || !mobile || !password)
      return res.status(400).json({ message: "All required fields missing" });

    const existing = await User.findOne({ mobile });
    if (existing) return res.status(400).json({ message: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      mobile,
      email,
      password: hashed,
    });

    const token = generateToken({ id: user._id });

    res.status(201).json({
      success: true,
      token,
      user,
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ User Login
export const login = async (req, res) => {
  try {
    const { mobile, password } = req.body;

    const user = await User.findOne({ mobile });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    const token = generateToken({ id: user._id });

    res.json({ success: true, token, user });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Admin Login
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
      const token = generateToken({ email, role: "admin" });
      return res.status(200).json({
        success: true,
        message: "Admin login successful",
        token,
      });
    } else {
      return res.status(401).json({ message: "Invalid admin credentials" });
    }
  } catch (err) {
    console.error("Admin login error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Fetch All Users (for Dashboard)
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.status(200).json(users);
  } catch (err) {
    console.error("Get users error:", err);
    res.status(500).json({ message: "Failed to fetch users" });
  }
};
