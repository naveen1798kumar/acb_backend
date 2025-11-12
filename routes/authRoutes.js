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

// 🧑‍💻 Local Auth Routes
router.post("/register", register);
router.post("/login", login);
router.post("/admin-login", adminLogin);

// 🔐 Get Current User Profile
router.get("/me", protect, getProfile);

// 🧠 Password Reset Routes
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

// 🌐 Google OAuth - Step 1: Redirect to Google
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["openid", "email", "profile"],
    session: false,
  })
);

// 🌐 Google OAuth - Step 2: Callback from Google
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${process.env.FRONTEND_URL}/login`,
    session: false,
  }),
  (req, res) => {
    try {
      // ✅ Safety check — ensure passport returned user data
      if (!req.user) {
        console.error("❌ Google OAuth failed: No user returned by passport");
        return res.redirect(`${process.env.FRONTEND_URL}/login`);
      }

      const { token, user } = req.user;
      if (!token || !user) {
        console.error("❌ Google OAuth missing token/user:", req.user);
        return res.redirect(`${process.env.FRONTEND_URL}/login`);
      }

      // ✅ Encode user safely to URL
      const encodedUser = encodeURIComponent(JSON.stringify(user));

      // ✅ Build redirect URL for frontend
      const redirectURL = `${process.env.FRONTEND_URL}/auth/success?token=${token}&user=${encodedUser}`;

      console.log("✅ Google OAuth successful for:", user.email);
      console.log("🔁 Redirecting to:", redirectURL);

      // ✅ Redirect back to frontend app
      return res.redirect(redirectURL);
    } catch (err) {
      console.error("❌ Google OAuth callback error:", err);
      return res.redirect(`${process.env.FRONTEND_URL}/login`);
    }
  }
);

export default router;
