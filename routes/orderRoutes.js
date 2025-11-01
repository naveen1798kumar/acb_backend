// backend/routes/orderRoutes.js
import express from "express";
import {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  setPaymentStatus,
  getOrdersByUser,
} from "../controllers/orderController.js";
import { protect, protectAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// 🛒 User: Create a new order
router.post("/", protect, createOrder);

// 👤 User/Admin: Get all orders for a specific user
router.get("/user/:userId", protect, getOrdersByUser);

// 🧾 Admin: Get all orders
router.get("/", protectAdmin, getOrders);

// 📦 User/Admin: Get single order by ID
router.get("/:id", protect, getOrderById);

// 🧑‍💼 Admin: Update order status
router.put("/:id/status", protectAdmin, updateOrderStatus);

// 💳 Admin: Update payment status
router.put("/:id/payment", protectAdmin, setPaymentStatus);

export default router;
