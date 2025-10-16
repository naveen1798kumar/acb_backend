// backend/controllers/userController.js
import User from "../models/User.js";

export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password -otp -otpExpires");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ user });
  } catch (err) {
    console.error("getUserProfile:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const updates = req.body;
    // Disallow password update here — create separate endpoint if needed
    delete updates.password;

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select("-password");
    res.json({ message: "Updated", user });
  } catch (err) {
    console.error("updateUserProfile:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Admin / Dashboard: list users (add admin check if you want)
export const listUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password -otp -otpExpires");
    res.json({ users });
  } catch (err) {
    console.error("listUsers:", err);
    res.status(500).json({ message: "Server error" });
  }
};
