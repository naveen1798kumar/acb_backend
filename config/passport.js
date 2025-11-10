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
        if (!email) {
          console.error("❌ No email in Google profile");
          return done(new Error("No email in Google profile"), null);
        }

        let user = await User.findOne({
          $or: [{ googleId: profile.id }, { email }],
        });

        if (!user) {
          console.log("🆕 Creating new user for:", email);
          user = await User.create({
            name: profile.displayName || email.split("@")[0],
            email,
            mobile: null,
            password: null,
            googleId: profile.id,
            authType: "google",
          });
        } else {
          if (!user.googleId) {
            console.log("🔗 Linking Google account to existing user:", email);
            user.googleId = profile.id;
            user.authType = "google";
            await user.save();
          }
        }

        const token = generateToken({ id: user._id });

        const safeUser = user.toObject ? user.toObject() : { ...user };
        delete safeUser.password;
        delete safeUser.resetToken;
        delete safeUser.resetTokenExpires;

        console.log("✅ Google OAuth success:", safeUser.email);
        return done(null, { token, user: safeUser });
      } catch (err) {
        console.error("❌ GoogleStrategy error:", err);
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((data, done) => done(null, data));
passport.deserializeUser((obj, done) => done(null, obj));

export default passport;
