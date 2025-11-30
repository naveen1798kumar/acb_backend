import cloudinary from "../utils/cloudinary.js";
import User from "../models/User.js";

// ✅ Get logged-in user profile
export const getUserProfile = async (req, res) => {
  try {
    console.log("🔹 Decoded req.user:", req.user);
    console.log("🔹 Looking for user ID:", req.user.id);

    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      console.log("❌ No user found for ID:", req.user.id);
      const allUsers = await User.find();
      console.log("📋 All user IDs in DB:", allUsers.map(u => u._id.toString()));
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user });
  } catch (err) {
    console.error("getUserProfile error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Update profile (final version)
export const updateUserProfile = async (req, res) => {
  try {
    const { name, email, mobile, picture } = req.body;

    const updateFields = { name, email, mobile };

    // picture will already be a Cloudinary URL
    if (picture) {
      updateFields.picture = picture;
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateFields,
      { new: true }
    ).select("-password");

    res.json({
      message: "Profile updated",
      user,
    });
  } catch (err) {
    console.error("updateUserProfile:", err);
    res.status(500).json({ message: "Server error" });
  }
};


// ✅ List all registered users (Admin only)
export const listUsers = async (req, res) => {
  try {
    console.log("✅ Admin verified:", req.admin);
    const users = await User.find().select("-password");
    console.log("✅ Total users found:", users.length);
    res.json({ users });
  } catch (err) {
    console.error("❌ listUsers error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

