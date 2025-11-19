// backend/routes/authRoutes.js
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

/* ----------------------- LOCAL AUTH ROUTES ----------------------- */
router.post("/register", register);
router.post("/login", login);
router.post("/admin-login", adminLogin);
router.get("/me", protect, getProfile);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

/* ----------------------- GOOGLE OAUTH ---------------------------- */

// Determine frontend URL safely
const frontendBase =
  process.env.NODE_ENV === "production"
    ? process.env.FRONTEND_URL      // Example: https://acbbakery.com
    : process.env.FRONTEND_URL_LOCAL; // Example: http://localhost:5173

console.log("🔵 Google OAuth using frontendBase:", frontendBase);

// ⚠ Ensure frontendBase exists
if (!frontendBase) {
  console.error("❌ ERROR: FRONTEND_BASE is NOT SET in .env");
}

/* ----------------- Step 1: Redirect user to Google ----------------- */
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);

/* ----------------- Step 2: Google Callback ----------------- */
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${frontendBase}/login`,
    session: false,
  }),
  (req, res) => {
    try {
      if (!req.user) return res.redirect(`${frontendBase}/login`);

      const { token, user } = req.user;
      const encodedUser = encodeURIComponent(JSON.stringify(user));

      const redirectURL = `${frontendBase}/auth/success?token=${token}&user=${encodedUser}`;

      return res.redirect(redirectURL);
    } catch (err) {
      return res.redirect(`${frontendBase}/login`);
    }
  }
);

export default router;
