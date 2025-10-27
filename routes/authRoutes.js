import express from "express";
import {
  register,
  login,
  adminLogin,
  getAllUsers,
} from "../controllers/authController.js";
import { protectAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// 👤 Users
router.post("/register", register);
router.post("/login", login);

// 🧑‍💼 Admin
router.post("/admin-login", adminLogin);
router.get("/users", protectAdmin, getAllUsers);

export default router;
