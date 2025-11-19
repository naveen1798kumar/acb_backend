// backend/config/passport.js
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import dotenv from "dotenv";
import User from "../models/User.js";
import { generateToken } from "../utils/generateToken.js";

dotenv.config();

const CALLBACK_URL =
  process.env.NODE_ENV === "production"
    ? process.env.GOOGLE_CALLBACK_URL
    : process.env.GOOGLE_CALLBACK_URL_LOCAL;

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log("🔹 Google OAuth profile received:", profile);

        const email = profile.emails?.[0]?.value?.toLowerCase();
        if (!email) return done(new Error("No email in Google profile"), null);

        // ✅ Find or create user
        let user = await User.findOne({
          $or: [{ googleId: profile.id }, { email }],
        });

        if (!user) {
          console.log("🆕 Creating new Google user:", email);
          user = new User({
            name: profile.displayName || email.split("@")[0],
            email,
            googleId: profile.id,
            authType: "google",
          });
          await user.save();
        } else if (!user.googleId) {
          user.googleId = profile.id;
          user.authType = "google";
          await user.save();
        }

        // ✅ Generate token
        const token = generateToken({ id: user._id });

        // ✅ Sanitize
        const safeUser = user.toObject();
        delete safeUser.password;
        delete safeUser.resetToken;
        delete safeUser.resetTokenExpires;

        console.log("✅ Google OAuth success:", safeUser.email);
        return done(null, { token, user: safeUser });
      } catch (err) {
        if (err.code === 11000) {
          console.warn("⚠️ Duplicate email detected during Google login");
          const existingUser = await User.findOne({
            email: profile.emails?.[0]?.value?.toLowerCase(),
          });
          if (existingUser) {
            const token = generateToken({ id: existingUser._id });
            const safeUser = existingUser.toObject();
            delete safeUser.password;
            return done(null, { token, user: safeUser });
          }
        }

        console.error("❌ GoogleStrategy error:", err);
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((data, done) => done(null, data));
passport.deserializeUser((obj, done) => done(null, obj));

export default passport;
