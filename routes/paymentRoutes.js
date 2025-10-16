import express from "express";
import { createPayment, verifyPayment } from "../controllers/paymentController.js";

const router = express.Router();

// Create UPI payment
router.post("/create", createPayment);

// Verify payment status
router.post("/verify", verifyPayment);

export default router;
