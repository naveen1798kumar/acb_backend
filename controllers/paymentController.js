// backend/controllers/paymentController.js
import Razorpay from "razorpay";
import crypto from "crypto";
import Payment from "../models/Payment.js";
import Order from "../models/Orders.js";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// 🧾 Create Razorpay Payment
export const createPayment = async (req, res) => {
  try {
    const { orderId, amount, customerName, customerEmail, customerMobile } = req.body;

    if (!orderId || !amount) {
      return res
        .status(400)
        .json({ message: "Order ID and amount are required" });
    }

    // ✅ 1. Always fetch order from DB and trust its total, not the raw client amount
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found for payment" });
    }

    const orderTotal = Number(order.total ?? order.totalAmount ?? 0);
    if (!orderTotal || orderTotal <= 0) {
      return res
        .status(400)
        .json({ message: "Order total must be greater than 0" });
    }

    // (Optional) sanity check: reject if frontend sent something wildly different
    const clientAmount = Number(amount);
    if (Math.round(clientAmount) !== Math.round(orderTotal)) {
      console.warn(
        "⚠️ Client amount mismatch",
        { clientAmount, orderTotal }
      );
      // we still proceed using orderTotal as source of truth
    }

    const amountInPaise = Math.round(orderTotal * 100);

    // 1️⃣ Create Razorpay Order (for modal payments)
    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise, // ₹ to paise
      currency: "INR",
      receipt: `receipt_${orderId}`,
      payment_capture: 1,
      notes: { integration: "ACB Bakery Payment", orderId: String(orderId) },
    });

    // 2️⃣ Save Payment in DB
    const payment = new Payment({
      orderId,
      amount: orderTotal,        // store in rupees for readability
      razorpayOrderId: razorpayOrder.id,
      status: "pending",
    });
    await payment.save();

    // 3️⃣ Create Payment Link for Desktop users (optional)
    const paymentLink = await razorpay.paymentLink.create({
      amount: amountInPaise,
      currency: "INR",
      accept_partial: false,
      description: `Payment for Order #${orderId}`,
      customer: {
        name: customerName,
        email: customerEmail,
        contact: customerMobile,
      },
      notify: {
        sms: true,
        email: true,
      },
      callback_url: `${process.env.FRONTEND_URL}/payment-success`,
      callback_method: "get",
    });

    // 4️⃣ Respond with all needed data for frontend
    res.status(201).json({
      success: true,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount, // still in paise (for Razorpay Checkout)
      currency: razorpayOrder.currency,
      key: process.env.RAZORPAY_KEY_ID,
      paymentMethods: ["card", "netbanking", "upi", "wallet"],
      paymentLink: paymentLink.short_url, // frontend can use for Desktop
    });
  } catch (err) {
    console.error("❌ Create Payment Error:", err);
    res
      .status(500)
      .json({ message: "Failed to create Razorpay payment" });
  }
};

// ✅ Verify Razorpay Payment
export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res
        .status(400)
        .json({ success: false, message: "Missing Razorpay parameters" });
    }

    // Generate expected signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    // ❌ Invalid signature -> mark payment as failed if we can find it
    if (expectedSignature !== razorpay_signature) {
      await Payment.findOneAndUpdate(
        { razorpayOrderId: razorpay_order_id },
        { status: "failed" }
      );
      return res
        .status(400)
        .json({ success: false, message: "Invalid signature" });
    }

    // ✅ Update payment status
    const payment = await Payment.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id },
      {
        razorpayPaymentId: razorpay_payment_id,
        status: "success",
      },
      { new: true }
    );

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment record not found for this Razorpay order",
      });
    }

    // ✅ Update corresponding order
    let updatedOrder = null;
    const order = await Order.findById(payment.orderId);
    if (order) {
      order.paymentStatus = "paid";
      order.status = "confirmed";
      await order.save();
      updatedOrder = order;
    }

    // Send back more useful info to frontend (if you want)
    res.json({
      success: true,
      message: "Payment verified successfully",
      payment,
      order: updatedOrder,
    });
  } catch (err) {
    console.error("❌ Verify Payment Error:", err);
    res
      .status(500)
      .json({ message: "Payment verification failed" });
  }
};
