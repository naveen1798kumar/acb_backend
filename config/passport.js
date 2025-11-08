import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
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
        // Find user by Google email
        const email = profile.emails?.[0]?.value;
        if (!email) return done(new Error("No email found in Google profile"), null);

        let user = await User.findOne({ email });

        if (!user) {
          // Create new user if not found
          user = await User.create({
            name: profile.displayName,
            email,
            password: "google_oauth_user",
            mobile: "google_user",
          });
        }

        // 🔑 Generate JWT token for session-less auth
        const token = jwt.sign(
          { id: user._id },
          process.env.JWT_SECRET,
          { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
        );

        done(null, {user, token});
      } catch (err) {
        console.error("Google OAuth Error:", err);
        done(err, null);
      }
    }
  )
);

passport.serializeUser((data, done) => done(null, data));
passport.deserializeUser((obj, done) => done(null, obj));

export default passport;

