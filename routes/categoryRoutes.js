// routes/categoryRoutes.js
import express from "express";
import { getCategories, createCategory, deleteCategory, addSubcategory, deleteSubcategory } from "../controllers/categoryController.js";
const router = express.Router();

router.get("/", getCategories); // Get all categories
router.post("/", createCategory); // Add new category
// DELETE /api/categories/:id
router.delete("/:id", deleteCategory);
router.post("/:categoryId/subcategories", addSubcategory);
router.delete("/:categoryId/subcategories/:subcategoryName", deleteSubcategory);


export default router;
