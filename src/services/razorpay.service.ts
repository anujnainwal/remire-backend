import Razorpay from "razorpay";
import { config } from "../config/env";

// Initialize Razorpay instance
export const razorpay = new Razorpay({
  key_id: config.RAZORPAY_KEY_ID!,
  key_secret: config.RAZORPAY_KEY_SECRET!,
});

// Create payment order
export const createPaymentOrder = async (
  amount: number,
  currency: string = "INR",
  receipt: string
) => {
  try {
    const options = {
      amount: amount, // Amount should already be in paise
      currency,
      receipt,
      payment_capture: 1, // Auto capture payment
    };

    const order = await razorpay.orders.create(options);
    return {
      success: true,
      order,
    };
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to create payment order",
    };
  }
};

// Verify payment signature
export const verifyPaymentSignature = (
  orderId: string,
  paymentId: string,
  signature: string
) => {
  try {
    const crypto = require("crypto");
    const expectedSignature = crypto
      .createHmac("sha256", config.RAZORPAY_KEY_SECRET!)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    return expectedSignature === signature;
  } catch (error) {
    console.error("Error verifying payment signature:", error);
    return false;
  }
};

// Verify webhook signature
export const verifyWebhookSignature = (body: string, signature: string) => {
  try {
    const crypto = require("crypto");
    const expectedSignature = crypto
      .createHmac("sha256", config.RAZORPAY_WEBHOOK_SECRET!)
      .update(body)
      .digest("hex");

    return expectedSignature === signature;
  } catch (error) {
    console.error("Error verifying webhook signature:", error);
    return false;
  }
};

// Capture payment
export const capturePayment = async (paymentId: string, amount: number) => {
  try {
    const payment = await razorpay.payments.capture(
      paymentId,
      amount * 100,
      "INR"
    );
    return {
      success: true,
      payment,
    };
  } catch (error) {
    console.error("Error capturing payment:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to capture payment",
    };
  }
};

// Get payment details
export const getPaymentDetails = async (paymentId: string) => {
  try {
    const payment = await razorpay.payments.fetch(paymentId);
    return {
      success: true,
      payment,
    };
  } catch (error) {
    console.error("Error fetching payment details:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch payment details",
    };
  }
};
