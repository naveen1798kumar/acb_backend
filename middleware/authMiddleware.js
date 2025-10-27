import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

// ✅ Verify Any User
export const protect = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer "))
      return res.status(401).json({ message: "Not authorized, token missing" });

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

// ✅ Verify Admin Only
export const protectAdmin = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer "))
      return res.status(401).json({ message: "Not authorized, token missing" });

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.role !== "admin") {
      return res.status(403).json({ message: "Access denied: Admins only" });
    }

    req.admin = decoded;
    next();
  } catch (err) {
    console.error("Admin auth error:", err);
    res.status(401).json({ message: "Invalid or expired token" });
  }
};
