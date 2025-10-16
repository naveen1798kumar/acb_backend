import User from "../models/User.js";
import Product from "../models/Product.js";

/**
 * @route   POST /api/cart
 * @desc    Add or update cart items for logged-in user
 * @access  Private
 */
export const addToCart = async (req, res) => {
  try {
    const { productId, qty } = req.body;

    // 🔒 Validation
    if (!productId || typeof qty !== "number" || qty <= 0) {
      return res.status(400).json({ message: "Valid product ID and quantity are required" });
    }

    // 🧠 Verify user exists
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // 🛍 Verify product exists
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    // 🧺 Find or update existing cart item
    const existingItem = user.cart.find(
      (item) => item.product.toString() === productId
    );

    if (existingItem) {
      existingItem.qty = qty; // overwrite quantity
    } else {
      user.cart.push({ product: productId, qty });
    }

    await user.save();

    // ✅ Return updated cart with populated product data
    const updatedUser = await User.findById(user._id).populate("cart.product");
    res.status(200).json({
      success: true,
      message: "Cart updated successfully",
      cart: updatedUser.cart,
    });
  } catch (err) {
    console.error("Error in addToCart:", err.message);
    res.status(500).json({ error: "Server error while updating cart" });
  }
};

/**
 * @route   GET /api/cart
 * @desc    Get user cart
 * @access  Private
 */
export const getCart = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("cart.product");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({
      success: true,
      cart: user.cart || [],
    });
  } catch (err) {
    console.error("Error in getCart:", err.message);
    res.status(500).json({ error: "Server error while fetching cart" });
  }
};
