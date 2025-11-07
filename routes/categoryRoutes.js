// routes/categoryRoutes.js
import express from "express";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  addSubcategory,
  deleteSubcategory,
} from "../controllers/categoryController.js";
import upload from "../middleware/upload.js";

const router = express.Router();

// GET all
router.get("/", getCategories);

// CREATE (with Cloudinary image upload)
router.post("/", upload.single("image"), createCategory);

// UPDATE name and/or image
router.put("/:id", upload.single("image"), updateCategory);

// DELETE category (also cleans Cloudinary image if present)
router.delete("/:id", deleteCategory);

// SUBCATEGORIES
router.post("/:categoryId/subcategories", addSubcategory);
router.delete("/:categoryId/subcategories/:subcategoryName", deleteSubcategory);

export default router;
