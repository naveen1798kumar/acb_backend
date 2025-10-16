import Payment from "../models/Payment.js";
import Order from "../models/Orders.js";
import { v4 as uuidv4 } from "uuid";

// Create a new payment (UPI link)
export const createPayment = async (req, res) => {
  try {
    const { orderId, amount } = req.body;
    if (!orderId || !amount) {
      return res.status(400).json({ message: "Order ID and amount required" });
    }

    // Create UPI link (for demonstration, we generate a mock link)
    const upiLink = `upi://pay?pa=${process.env.MERCHANT_UPI_ID}&pn=ACB%20Bakery&am=${amount}&cu=INR&tn=Order%20${orderId}`;

    const payment = new Payment({
      orderId,
      amount,
      upiLink,
    });

    await payment.save();

    res.status(201).json({ paymentId: payment._id, upiLink });
  } catch (err) {
    console.error("❌ Create payment error:", err);
    res.status(500).json({ message: "Failed to create payment" });
  }
};

// Verify payment success
export const verifyPayment = async (req, res) => {
  try {
    const { paymentId, status } = req.body;

    const payment = await Payment.findById(paymentId);
    if (!payment) return res.status(404).json({ message: "Payment not found" });

    payment.status = status; // pending / success / failed
    await payment.save();

    // Update order paymentStatus if success
    if (status === "success") {
      const order = await Order.findById(payment.orderId);
      if (order) {
        order.paymentStatus = "paid";
        order.status = "confirmed";
        await order.save();
      }
    }

    res.json({ message: "Payment updated", payment });
  } catch (err) {
    console.error("❌ Verify payment error:", err);
    res.status(500).json({ message: "Failed to verify payment" });
  }
};
