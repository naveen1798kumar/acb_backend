import express from "express";
import passport from "passport";
import {
  register,
  login,
  adminLogin,
  getProfile,
  forgotPassword,
  resetPassword,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/admin-login", adminLogin);

// current logged-in user
router.get("/me", protect, getProfile);

// 🧠 New routes
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

// 🌐 Google OAuth routes
router.get(
  "/google",
  passport.authenticate("google", { scope: ["openid", "email", "profile"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${process.env.FRONTEND_URL}/login`,
    session: false,
  }),
  (req, res) => {
    const { token, user } = req.user;
    const encodedUser = encodeURIComponent(JSON.stringify(user));
    res.redirect(`${process.env.FRONTEND_URL}/auth/success?token=${token}&user=${encodedUser}`);
  }
);

export default router;
