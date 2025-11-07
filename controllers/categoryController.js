// controllers/categoryController.js
import Category from "../models/Category.js";
import cloudinary from "../utils/cloudinary.js";

/* ==========================================================
   🟢 GET ALL CATEGORIES
========================================================== */
export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({}).sort({ name: 1 });
    res.json(categories);
  } catch (err) {
    console.error("❌ Get categories error:", err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

/* ==========================================================
   🟢 CREATE CATEGORY (with Cloudinary image upload)
========================================================== */
export const createCategory = async (req, res) => {
  try {
    console.log("🟢 Incoming category:", req.body);
    console.log("📸 Uploaded file:", req.file);
  
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "Category name is required" });

    // check if category already exists
    const existing = await Category.findOne({ name });
    if (existing)
      return res.status(400).json({ message: "Category already exists" });

    const newCategory = new Category({
      name: name.trim(),
      image: req.file?.path || null,
      imagePublicId: req.file?.filename || null,
    });

    const saved = await newCategory.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error("❌ Create category error:", err);
    res.status(500).json({ message: "Failed to create category", error: err.message });
  }
};

/* ==========================================================
   🟡 UPDATE CATEGORY (rename + image replacement)
========================================================== */
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const category = await Category.findById(id);
    if (!category) return res.status(404).json({ message: "Category not found" });

    // if a new image uploaded, delete the old one from cloudinary
    if (req.file) {
      if (category.imagePublicId) {
        try {
          await cloudinary.uploader.destroy(category.imagePublicId);
        } catch (e) {
          console.warn("⚠️ Could not delete old Cloudinary image:", e.message);
        }
      }
      category.image = req.file.path;
      category.imagePublicId = req.file.filename;
    }

    if (name) category.name = name.trim();

    const updated = await category.save();
    res.json(updated);
  } catch (err) {
    console.error("❌ Update category error:", err);
    res.status(500).json({ message: "Failed to update category", error: err.message });
  }
};

/* ==========================================================
   🔴 DELETE CATEGORY (and its Cloudinary image)
========================================================== */
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);
    if (!category) return res.status(404).json({ message: "Category not found" });

    // Delete from Cloudinary if image exists
    if (category.imagePublicId) {
      try {
        await cloudinary.uploader.destroy(category.imagePublicId);
      } catch (e) {
        console.warn("⚠️ Cloudinary deletion failed:", e.message);
      }
    }

    await Category.findByIdAndDelete(id);
    res.json({ message: "Category deleted successfully", id });
  } catch (err) {
    console.error("❌ Delete category error:", err);
    res.status(500).json({ message: "Failed to delete category", error: err.message });
  }
};

/* ==========================================================
   🟢 ADD SUBCATEGORY
========================================================== */
export const addSubcategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { name } = req.body;
    if (!name)
      return res.status(400).json({ message: "Subcategory name is required" });

    const category = await Category.findById(categoryId);
    if (!category)
      return res.status(404).json({ message: "Category not found" });

    if (category.subcategories.some((sc) => sc.name === name))
      return res.status(400).json({ message: "Subcategory already exists" });

    category.subcategories.push({ name: name.trim() });
    const updated = await category.save();

    res.status(201).json(updated);
  } catch (err) {
    console.error("❌ Add subcategory error:", err);
    res.status(500).json({ message: "Failed to add subcategory", error: err.message });
  }
};

/* ==========================================================
   🔴 DELETE SUBCATEGORY
========================================================== */
export const deleteSubcategory = async (req, res) => {
  try {
    const { categoryId, subcategoryName } = req.params;

    const category = await Category.findById(categoryId);
    if (!category)
      return res.status(404).json({ message: "Category not found" });

    category.subcategories = category.subcategories.filter(
      (sc) => sc.name !== subcategoryName
    );

    const updated = await category.save();
    res.json(updated);
  } catch (err) {
    console.error("❌ Delete subcategory error:", err);
    res.status(500).json({ message: "Failed to delete subcategory", error: err.message });
  }
};
