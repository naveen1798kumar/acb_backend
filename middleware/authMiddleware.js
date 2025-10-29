import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

// ✅ Protect any logged-in user
export const protect = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Not authorized, token missing" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    // ✅ normalize ID field from JWT payload
    const userId = decoded.id || decoded._id || decoded.userId;
    if (!userId) {
      console.error("❌ Invalid token payload:", decoded);
      return res.status(401).json({ message: "Invalid token payload" });
    }

    req.user = { id: userId }; // 🔑 always consistent field
    next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

// ✅ Protect admin-only routes
export const protectAdmin = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer "))
      return res.status(401).json({ message: "Not authorized, token missing" });

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    if (!decoded.role || decoded.role !== "admin") {
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
