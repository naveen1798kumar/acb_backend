import Product from "../models/Product.js";

// @desc    Get all products
// @route   GET /api/products
export const getProducts = async (req, res) => {
  try {
    const products = await Product.find({});
    res.json(products);
  } catch (err) {
    console.error("❌ Get products error:", err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

// Get single product by ID ✅
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Create new product
// @route   POST /api/products
export const createProduct = async (req, res) => {
  try {
    console.log("🟢 Incoming Body:", req.body);
    console.log("🟢 Uploaded File:", req.file);

    const { name, category, subcategory, description, isTopSelling, featured, eventId } = req.body;

    // ✅ Handle uploaded image
    const imageUrl = req.file ? req.file.path : "";

    // ✅ Parse variants properly
    const variants = req.body.variants ? JSON.parse(req.body.variants) : [];

    // ✅ Create the product
    const product = new Product({
      name,
      category,
      subcategory: subcategory || "",
      description: description || "",
      image: imageUrl,
      isTopSelling: isTopSelling === "true" || isTopSelling === true,
      featured: featured === "true" || featured === true,
      eventId: category === "Special Events" ? eventId : null,
      variants,
    });

    const createdProduct = await product.save();

    res.status(201).json({
      message: "✅ Product created successfully",
      product: createdProduct,
    });

  } catch (err) {
    console.error("❌ Create product error:", err);
    res.status(500).json({
      message: "Failed to create product",
      error: err.message,
    });
  }
};

// @desc    Get top selling products
// @route   GET /api/products/top-selling
export const getTopSellingProducts = async (req, res) => {
  try {
    const products = await Product.find({ isTopSelling: true }).limit(10);
    res.json(products);
  } catch (err) {
    console.error("❌ Get top-selling error:", err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const updateData = { ...req.body };

    if (req.body.variants && typeof req.body.variants === "string") {
      updateData.variants = JSON.parse(req.body.variants);
    }

    if (req.file) {
      updateData.image = req.file.path;
    }

    const updatedProduct = await Product.findByIdAndUpdate(id, updateData, { new: true });
    if (!updatedProduct) return res.status(404).json({ message: "Product not found" });

    res.json(updatedProduct);
  } catch (error) {
    console.error("❌ Error updating product:", error);
    res.status(500).json({ message: "Server error while updating product" });
  }
};



// @desc    Delete product
// @route   DELETE /api/products/:id
export const deleteProduct = async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);

    if (!deletedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ message: "✅ Product deleted successfully" });
  } catch (err) {
    console.error("❌ Delete product error:", err);
    res.status(500).json({ message: "Failed to delete product", error: err.message });
  }
};
