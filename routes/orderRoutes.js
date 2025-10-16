// backend/routes/orderRoutes.js
import express from "express";
import {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  setPaymentStatus,
} from "../controllers/orderController.js";

const router = express.Router();

// Public: create order (from frontend)
router.post("/", createOrder);

// Admin: list orders
router.get("/", getOrders);

// Public/admin: order details
router.get("/:id", getOrderById);

// Update order status (admin)
router.put("/:id/status", updateOrderStatus);

// Update payment status
router.put("/:id/payment", setPaymentStatus);

export default router;
