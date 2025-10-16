import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

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

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

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

export const login = async (req, res) => {
  try {
    const { mobile, password } = req.body;
    console.log("📩 Login attempt:", req.body); // 👈 Add this

    const user = await User.findOne({ mobile });
    if (!user) {
      console.log("❌ User not found for mobile:", mobile);
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("⚠️ Invalid password for user:", mobile);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    console.log("✅ Login success:", user.name);

    res.json({
      success: true,
      token,
      user,
    });
  } catch (err) {
    console.error("💥 Login server error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

