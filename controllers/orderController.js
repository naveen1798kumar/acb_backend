// backend/controllers/orderController.js
import Order from "../models/Orders.js";

/**
 * ✅ Create a new order
 * Called when the user completes checkout (before or after payment)
 */
export const createOrder = async (req, res) => {
  try {
    const {
      items,
      subtotal,
      shipping = 0,
      total,
      customer,
      paymentMethod = "upi", // default to UPI now
      userId,
      notes,
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Order items required" });
    }

    const order = new Order({
      items,
      subtotal,
      shipping,
      total,
      customer,
      paymentMethod,
      userId: userId || null,
      notes,
      paymentStatus: "pending", // always pending until payment success
      status: "created",
    });

    await order.save();
    res.status(201).json(order);
  } catch (err) {
    console.error("❌ Create order error:", err);
    res.status(500).json({ message: "Failed to create order", error: err.message });
  }
};

/**
 * ✅ Get all orders (for admin dashboard)
 */
export const getOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error("❌ Get orders error:", err);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};

/**
 * ✅ Get a single order by ID
 */
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  } catch (err) {
    console.error("❌ Get order error:", err);
    res.status(500).json({ message: "Failed to fetch order" });
  }
};

/**
 * ✅ Update order status (admin panel)
 */
export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    order.status = status || order.status;
    await order.save();
    res.json({ message: "Order updated", order });
  } catch (err) {
    console.error("❌ Update order error:", err);
    res.status(500).json({ message: "Failed to update order" });
  }
};

/**
 * ✅ Update payment status (used for UPI or Razorpay verification)
 * PUT /api/orders/:id/payment
 */
export const setPaymentStatus = async (req, res) => {
  try {
    const { paymentStatus, paymentMeta } = req.body;
    const { id } = req.params;

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.paymentStatus = paymentStatus || order.paymentStatus;
    order.paymentMeta = paymentMeta || order.paymentMeta;

    // Automatically confirm the order when payment is successful
    if (paymentStatus === "paid") {
      order.status = "confirmed";
    }

    await order.save();
    res.json({ message: "Payment status updated", order });
  } catch (err) {
    console.error("❌ Set payment status error:", err);
    res.status(500).json({ message: "Failed to update payment status" });
  }
};
