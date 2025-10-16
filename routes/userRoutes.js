// backend/routes/userRoutes.js
import express from "express";
import { getUserProfile, updateUserProfile, listUsers } from "../controllers/userController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { getCart, addToCart } from "../controllers/cartController.js";


const router = express.Router();

router.get("/me", authMiddleware, getUserProfile);
router.put("/update", authMiddleware, updateUserProfile);

// Cart routes
router.get("/cart", authMiddleware, getCart);
router.put("/cart", authMiddleware, addToCart);

// For dashboard admin (optionally restrict later with admin role)
router.get("/", authMiddleware, listUsers);

export default router;
