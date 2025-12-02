// backend/index.js
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import passport from "passport";
import path from "path";
import { fileURLToPath } from "url";

// 🔐 Load environment and passport strategy
dotenv.config();
import "./config/passport.js";

// 🧭 Directory setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🚀 Initialize app
const app = express();

// ✅ Essential middleware first
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Configure CORS before routes
const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.CLIENT_URL_WWW,
  process.env.DASHBOARD_URL,
  process.env.DASHBOARD_URL_LOCAL,
  process.env.LOCAL_CLIENT,
  "http://localhost:5173",
  "http://localhost:5174",
  "https://acbbakery.com",
  "https://www.acbbakery.com",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        origin?.includes("google.com")
      )
        callback(null, true);
      else {
        console.error("❌ CORS Blocked Origin:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

// ✅ Initialize Passport AFTER other global middleware
app.use(passport.initialize());

// ✅ Database connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// ✅ Import routes
import productRoutes from "./routes/productRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";

// ✅ Register routes
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/users", userRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);

// ✅ Root route
app.get("/", (req, res) => res.send("Welcome to ACB Bakery API 🍞"));

// ✅ Serve React build in production
if (process.env.NODE_ENV === "production") {
  const clientPath = path.join(__dirname, "../client/dist");
  app.use(express.static(clientPath));

  app.get(/.*/, (req, res) => {
    res.sendFile(path.join(clientPath, "index.html"));
  });
}

// ✅ CORS error handling
app.use((err, req, res, next) => {
  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({ message: "CORS policy violation" });
  }
  next(err);
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
