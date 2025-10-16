import express from "express";
import {
  getProducts,
  createProduct,
  getTopSellingProducts,
  updateProduct,
  deleteProduct,
  getProductById
} from "../controllers/productController.js";
import upload from "../middleware/upload.js";
const router = express.Router();

router.get("/", getProducts);
router.get("/:id", getProductById);
router.post("/", upload.single("image"), createProduct);
router.get("/top-selling", getTopSellingProducts); // ✅ new route

router.put("/:id", upload.single("image"), updateProduct); // ✅ update product
router.delete("/:id", deleteProduct); // ✅ delete product

export default router;
