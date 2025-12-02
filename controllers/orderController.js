// backend/controllers/orderController.js
import Order from "../models/Orders.js";
import Payment from "../models/Payment.js";

/**
 * ✅ Create a new order
 */
export const createOrder = async (req, res) => {
  try {
    const {
      items,
      subtotal,
      shipping = 0,
      total,
      customer,
      paymentMethod = "upi",
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
      // ✅ Always link userId if available
      userId: userId || req.user?._id || req.user?.id || null,
      notes,
      paymentStatus: "pending",
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
 * ✅ Get all orders (admin only)
 */
export const getOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (err) {
    console.error("❌ Get orders error:", err);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};

/**
 * ✅ Get all orders for a specific user
 * Works for both admin or the same user.
 */
export const getOrdersByUser = async (req, res) => {
  try {
    const userIdFromParam = req.params.userId;
    const userIdFromToken = req.user?._id || req.user?.id;
    const userId = (userIdFromParam || userIdFromToken)?.toString();

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    console.log("🔍 Fetching orders for userId:", userId);

    // ✅ Try matching both possible fields: userId OR user
    const orders = await Order.find({
      $or: [{ userId: userId }, { user: userId }],
    })
      .sort({ createdAt: -1 })
      // If your schema has refs, this is safe; if not, remove populate
      .populate("userId", "name email mobile")
      .populate("user", "name email mobile");

    console.log("✅ Orders found:", orders.length);

    return res.json({ orders });
  } catch (err) {
    console.error("❌ getOrdersByUser error:", err);
    return res.status(500).json({ message: "Failed to fetch user orders" });
  }
};


/**
 * ✅ Get a single order by ID (user or admin)
 */
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // 🔹 Find related payment (if any)
    const payment = await Payment.findOne({ orderId: order._id });

    // 🔹 Convert to plain object and attach payment
    const orderObj = order.toObject();
    orderObj.payment = payment || null;

    // ✅ Keep response shape same as before (just with extra field)
    return res.status(200).json(orderObj);
  } catch (err) {
    console.error("❌ Get order error:", err);
    res.status(500).json({ message: "Failed to fetch order" });
  }
};


/**
 * ✅ Update order status (admin only)
 */
export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.status = status || order.status;
    await order.save();

    res.status(200).json({ message: "Order updated", order });
  } catch (err) {
    console.error("❌ Update order error:", err);
    res.status(500).json({ message: "Failed to update order" });
  }
};

/**
 * ✅ Update payment status (admin or automated webhook)
 */
export const setPaymentStatus = async (req, res) => {
  try {
    const { paymentStatus, paymentMeta } = req.body;
    const { id } = req.params;

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.paymentStatus = paymentStatus || order.paymentStatus;
    order.paymentMeta = paymentMeta || order.paymentMeta;

    if (paymentStatus === "paid") order.status = "confirmed";

    await order.save();
    res.status(200).json({ message: "Payment status updated", order });
  } catch (err) {
    console.error("❌ Set payment status error:", err);
    res.status(500).json({ message: "Failed to update payment status" });
  }
};
