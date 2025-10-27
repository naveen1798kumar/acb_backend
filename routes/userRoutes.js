// backend/routes/userRoutes.js
import express from "express";
import { getUserProfile, updateUserProfile, listUsers } from "../controllers/userController.js";
import {protect, protectAdmin} from "../middleware/authMiddleware.js";
import { getCart, addToCart } from "../controllers/cartController.js";


const router = express.Router();

router.get("/me", protect, getUserProfile);
router.put("/update", protect, updateUserProfile);

// Cart routes
router.get("/cart", protect, getCart);
router.put("/cart", protect, addToCart);

// For dashboard admin (optionally restrict later with admin role)
router.get("/", protectAdmin, listUsers);

export default router;
