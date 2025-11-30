import jwt from "jsonwebtoken";
import User from "../models/User.js";
// import dotenv from "dotenv";
// dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

// 🔒 Protect Logged-in Users OR Admins
export const protect = async (req, res, next) => {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith("Bearer "))
      return res.status(401).json({ message: "Token missing" });

    const token = auth.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    // If ADMIN TOKEN (has role only)
    if (decoded.role === "admin") {
      req.admin = { email: decoded.email, role: "admin" };
      return next();
    }

    // Otherwise expect a normal user token with id
    if (!decoded.id) {
      return res.status(401).json({ message: "Invalid token payload" });
    }

    // USER TOKEN (has ID)
    const user = await User.findById(decoded.id).select("-password");
    if (!user)
      return res.status(404).json({ message: "User not found" });

    req.user = user;
    next();
  } catch (err) {
    console.error("Auth error:", err);
    res.status(401).json({ message: "Invalid token" });
  }
};

// 👑 Admin-only
export const protectAdmin = (req, res, next) => {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Token missing" });
    }

    const token = auth.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    req.admin = { email: decoded.email, role: decoded.role };
    next();
  } catch (err) {
    console.error("Admin auth error:", err.message);
    return res.status(401).json({ message: "Invalid admin token" });
  }
};
