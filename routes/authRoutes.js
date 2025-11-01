import express from "express";
import {
  register,
  login,
  adminLogin,
  getProfile
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/admin-login", adminLogin);

// current logged-in user
router.get("/me", protect, getProfile);

export default router;
