import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    mobile: { type: String, required: true, unique: true }, // ✅ Added this
    email: { type: String }, // optional
    password: { type: String, required: true },
    cart: { type: Array, default: [] } 
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;
