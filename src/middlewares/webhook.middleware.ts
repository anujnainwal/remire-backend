import { Request, Response, NextFunction } from "express";
import { verifyWebhookSignature } from "../services/razorpay.service";
import { responseHelper } from "../utils/responseHelper";

// Middleware to handle Razorpay webhook signature verification
export const razorpayWebhookMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const signature = req.headers["x-razorpay-signature"] as string;

    if (!signature) {
      return responseHelper.unauthorized(res, "Missing webhook signature");
    }

    // Get raw body for signature verification
    const rawBody = req.body;

    // Verify webhook signature
    const isValidSignature = verifyWebhookSignature(
      JSON.stringify(rawBody),
      signature
    );

    if (!isValidSignature) {
      console.error("Invalid webhook signature");
      return responseHelper.unauthorized(res, "Invalid webhook signature");
    }

    // If signature is valid, proceed to the controller
    next();
  } catch (error) {
    console.error("Error in webhook middleware:", error);
    return responseHelper.serverError(res, "Webhook verification failed");
  }
};

// Middleware to parse raw body for webhooks
export const rawBodyParser = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.path === "/api/v1/razorpay-webhook") {
    let data = "";
    req.setEncoding("utf8");

    req.on("data", (chunk) => {
      data += chunk;
    });

    req.on("end", () => {
      try {
        req.body = JSON.parse(data);
        next();
      } catch (error) {
        console.error("Error parsing webhook body:", error);
        return responseHelper.badRequest(res, "Invalid JSON body");
      }
    });
  } else {
    next();
  }
};

