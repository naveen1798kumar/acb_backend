// backend/models/Order.js
import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  name: String,
  image: String,
  variantLabel: String,
  price: Number,
  qty: { type: Number, default: 1 },
});

const orderSchema = new mongoose.Schema(
  {
    items: [orderItemSchema],
    subtotal: { type: Number, required: true },
    shipping: { type: Number, default: 0 },
    total: { type: Number, required: true },
    currency: { type: String, default: "INR" },

    // customer info (collected at checkout)
    customer: {
      name: String,
      email: String,
      phone: String,
      address: {
        line1: String,
        line2: String,
        city: String,
        state: String,
        pincode: String,
      },
    },

    // payment
    paymentMethod: { type: String, enum: ["razorpay", "cod", "other", "upi"], default: "razorpay" },
    paymentStatus: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },
    paymentMeta: { type: Object },

    // reference to dashboard / user if needed
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    // fulfilment
    status: {
      type: String,
      enum: ["created", "confirmed", "packed", "shipped", "delivered", "cancelled", "refunded"],
      default: "created",
    },

    notes: { type: String },
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);
export default Order;
