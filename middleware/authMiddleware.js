import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

// ✅ Middleware for logged-in users
export const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ message: "No token, authorization denied" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      return res.status(404).json({ message: "User not found" });
    }

    next();
  } catch (err) {
    console.error("Auth error:", err);
    res.status(401).json({ message: "Invalid token" });
  }
};

// ✅ Middleware for admin-only routes
export const protectAdmin = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer "))
      return res.status(401).json({ message: "Not authorized, token missing" });

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.role !== "admin") {
      console.error("❌ Access denied. Token payload:", decoded);
      return res.status(403).json({ message: "Access denied: Admins only" });
    }

    req.admin = decoded;
    next();
  } catch (err) {
    console.error("Admin auth error:", err);
    res.status(401).json({ message: "Invalid or expired token" });
  }
};
