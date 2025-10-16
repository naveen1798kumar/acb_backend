import Category from "../models/Category.js";

export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({}).sort({ name: 1 });
    res.json(categories);
  } catch (err) {
    console.error("❌ Get categories error:", err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

export const createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "Name required" });

    const existing = await Category.findOne({ name });
    if (existing) return res.status(400).json({ message: "Category already exists" });

    const cat = new Category({ name });
    const saved = await cat.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error("❌ Create category error:", err);
    res.status(500).json({ message: "Failed to create category", error: err.message });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const deleted = await Category.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Category not found" });
    res.json({ message: "Category deleted", id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: "Error deleting category", error });
  }
};

// Add subcategory
export const addSubcategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "Subcategory name required" });

    const category = await Category.findById(categoryId);
    if (!category) return res.status(404).json({ message: "Category not found" });

    if (category.subcategories.some(sc => sc.name === name))
      return res.status(400).json({ message: "Subcategory already exists" });

    category.subcategories.push({ name });
    await category.save();
    res.status(201).json(category);
  } catch (err) {
    res.status(500).json({ message: "Failed to add subcategory", error: err.message });
  }
};

// Delete subcategory
export const deleteSubcategory = async (req, res) => {
  try {
    const { categoryId, subcategoryName } = req.params;
    const category = await Category.findById(categoryId);
    if (!category) return res.status(404).json({ message: "Category not found" });

    category.subcategories = category.subcategories.filter(sc => sc.name !== subcategoryName);
    await category.save();
    res.json(category);
  } catch (err) {
    res.status(500).json({ message: "Failed to delete subcategory", error: err.message });
  }
};
