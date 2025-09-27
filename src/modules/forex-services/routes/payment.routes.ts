import { Router } from "express";
import {
  createPaymentOrderController,
  verifyPaymentController,
  getPaymentStatusController,
} from "../controllers/payment.controller";
import { razorpayWebhookController } from "../controllers/webhook.controller";
import authGuard from "../../../middlewares/auth.middleware";

const router = Router();

// Payment routes (require authentication)
router.use(authGuard);

// Create payment order
router.post("/payment/create-order", createPaymentOrderController);

// Verify payment
router.post("/payment/verify", verifyPaymentController);

// Get payment status
router.get("/payment/status/:orderId", getPaymentStatusController);

// Webhook route (no authentication required)
router.post("/webhook/razorpay", razorpayWebhookController);

export default router;



