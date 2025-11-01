import express from "express";
import {
  getUserProfile,
  updateUserProfile,
  listUsers,
} from "../controllers/userController.js";
import { protect, protectAdmin } from "../middleware/authMiddleware.js";
import { getCart, addToCart } from "../controllers/cartController.js";

const router = express.Router();

// Public/protected user endpoints
// GET /api/users/me        -> returns current user (protected)
router.get("/me", protect, getUserProfile);

// PUT /api/users/update    -> update current user's profile (protected)
router.put("/update", protect, updateUserProfile);

// Cart endpoints (per-user)
router.get("/cart", protect, getCart);
router.put("/cart", protect, addToCart);

// Admin: list all users
// GET /api/users/          -> returns list of users (admin only)
router.get("/", protectAdmin, listUsers);

export default router;
