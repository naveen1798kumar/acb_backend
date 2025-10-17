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
      return res.status(400).json({ message: "Order ID and amount required" });
    }

    // 1️⃣ Create Razorpay Order (used for modal payments)
    const razorpayOrder = await razorpay.orders.create({
      amount: amount * 100, // ₹ to paise
      currency: "INR",
      receipt: `receipt_${orderId}`,
      payment_capture: 1,
      notes: { integration: "ACB Bakery Payment" },
    });

    // 2️⃣ Save in DB
    const payment = new Payment({
      orderId,
      amount,
      razorpayOrderId: razorpayOrder.id,
      status: "pending",
    });
    await payment.save();

    // 3️⃣ Optional: Create Payment Link for Desktop users (UPI via mobile)
    const paymentLink = await razorpay.paymentLink.create({
      amount: amount * 100,
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

    // 4️⃣ Respond with both modal order and payment link
    res.status(201).json({
      success: true,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key: process.env.RAZORPAY_KEY_ID,
      methods: ["card", "netbanking", "upi", "wallet"],
      paymentLink: paymentLink.short_url, // frontend can show this as "Pay via Mobile"
    });
  } catch (err) {
    console.error("❌ Create Payment Error:", err);
    res.status(500).json({ message: "Failed to create Razorpay payment" });
  }
};

// ✅ Verify Razorpay Payment
export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Invalid signature" });
    }

    const payment = await Payment.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id },
      { razorpayPaymentId: razorpay_payment_id, status: "success" },
      { new: true }
    );

    if (payment) {
      const order = await Order.findById(payment.orderId);
      if (order) {
        order.paymentStatus = "paid";
        order.status = "confirmed";
        await order.save();
      }
    }

    res.json({ success: true, message: "Payment verified successfully" });
  } catch (err) {
    console.error("❌ Verify Payment Error:", err);
    res.status(500).json({ message: "Payment verification failed" });
  }
};
