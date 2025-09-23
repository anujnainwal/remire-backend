import { Router } from "express";
import { razorpayWebhookController } from "../controllers/webhook.controller";
import { razorpayWebhookMiddleware } from "../../../middlewares/webhook.middleware";
import { Request, Response } from "express";
import { responseHelper } from "../../../utils/responseHelper";

const router = Router();

// Razorpay webhook endpoint with signature verification
router.post(
  "/razorpay-webhook",
  razorpayWebhookMiddleware,
  razorpayWebhookController
);

// Test endpoint for webhook (development only)
router.post("/razorpay-webhook-test", (req: Request, res: Response) => {
  console.log("Test webhook endpoint called with body:", req.body);
  return responseHelper.success(
    res,
    { message: "Test webhook received" },
    "Test webhook processed"
  );
});

export default router;
