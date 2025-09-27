import { Request, Response } from "express";
import { responseHelper } from "../../../utils/responseHelper";
import { AuthRequest } from "../../../middlewares/auth.middleware";
import {
  createPaymentOrder,
  verifyPaymentSignature,
  capturePayment,
} from "../../../services/razorpay.service";
import OrderModel from "../models/Order.model";
import CartModel from "../models/Cart.model";
import { z } from "zod";

// Validation schema for create payment order
const createPaymentOrderSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  currency: z.string().min(1, "Currency is required").default("INR"),
  cartId: z.string().min(1, "Cart ID is required"),
});

// Validation schema for verify payment
const verifyPaymentSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
  paymentId: z.string().min(1, "Payment ID is required"),
  signature: z.string().min(1, "Signature is required"),
});

// Create payment order
export const createPaymentOrderController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.user && req.user._id;
    if (!userId) return responseHelper.unauthorized(res);

    const body = req.body || {};
    const parsed = createPaymentOrderSchema.safeParse(body);
    if (!parsed.success) {
      return responseHelper.validationError(
        res,
        parsed.error.issues[0].message
      );
    }

    const { amount, currency, cartId } = parsed.data;

    // Get cart details
    const cart = await CartModel.findOne({
      _id: cartId,
      user: userId,
      status: "active",
    });

    if (!cart) {
      return responseHelper.notFound(res, "Cart not found");
    }

    // Determine order type from cart items
    const orderType =
      cart.items.length > 0 ? cart.items[0].serviceType : "send-money";

    // Generate order number
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    const orderNumber = `ORD-${timestamp}-${random}`;

    // Create order in database
    const order = new OrderModel({
      user: userId,
      cart: cartId,
      orderType: orderType,
      orderNumber: orderNumber,
      status: "pending",
      paymentStatus: "pending",
      totalAmount: amount,
      currency: currency,
      paymentMethod: "razorpay",
      metadata: {
        cartItems: cart.items,
        subtotal: cart.subtotal,
        discountAmount: cart.discountAmount,
        taxAmount: cart.taxAmount,
      },
    });

    await order.save();

    // Create Razorpay order
    const receipt = `order_${order._id}`;
    const razorpayOrder = await createPaymentOrder(amount, currency, receipt);

    if (!razorpayOrder.success) {
      return responseHelper.serverError(
        res,
        razorpayOrder.error || "Failed to create payment order"
      );
    }

    // Update order with Razorpay order ID
    if (razorpayOrder.order) {
      order.razorpayOrderId = razorpayOrder.order.id;
      await order.save();

      return responseHelper.success(
        res,
        {
          orderId: order._id,
          razorpayOrderId: razorpayOrder.order.id,
          amount: razorpayOrder.order.amount,
          currency: razorpayOrder.order.currency,
          key: process.env.RAZORPAY_KEY_ID,
        },
        "Payment order created successfully"
      );
    } else {
      return responseHelper.serverError(res, "Failed to create Razorpay order");
    }
  } catch (err) {
    console.error("Error creating payment order:", err);
    return responseHelper.serverError(res, "Failed to create payment order");
  }
};

// Verify payment
export const verifyPaymentController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.user && req.user._id;
    if (!userId) return responseHelper.unauthorized(res);

    const body = req.body || {};
    const parsed = verifyPaymentSchema.safeParse(body);
    if (!parsed.success) {
      return responseHelper.validationError(
        res,
        parsed.error.issues[0].message
      );
    }

    const { orderId, paymentId, signature } = parsed.data;

    // Find order
    const order = await OrderModel.findOne({
      _id: orderId,
      user: userId,
    });

    if (!order) {
      return responseHelper.notFound(res, "Order not found");
    }

    // Verify payment signature
    const isValidSignature = verifyPaymentSignature(
      order.razorpayOrderId!,
      paymentId,
      signature
    );

    if (!isValidSignature) {
      return responseHelper.badRequest(res, "Invalid payment signature");
    }

    // Update order status
    order.paymentId = paymentId;
    order.paymentStatus = "completed";
    order.status = "completed";
    order.completedAt = new Date();
    await order.save();

    // Clear cart
    const cart = await CartModel.findOne({
      _id: order.cart,
      user: userId,
    });

    if (cart) {
      cart.status = "completed";
      cart.items = [];
      cart.subtotal = 0;
      cart.totalAmount = 0;
      await cart.save();
    }

    return responseHelper.success(
      res,
      {
        orderId: order._id,
        paymentId,
        status: "completed",
      },
      "Payment verified successfully"
    );
  } catch (err) {
    console.error("Error verifying payment:", err);
    return responseHelper.serverError(res, "Failed to verify payment");
  }
};

// Get payment status
export const getPaymentStatusController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.user && req.user._id;
    if (!userId) return responseHelper.unauthorized(res);

    const { orderId } = req.params;

    const order = await OrderModel.findOne({
      _id: orderId,
      user: userId,
    });

    if (!order) {
      return responseHelper.notFound(res, "Order not found");
    }

    return responseHelper.success(
      res,
      {
        orderId: order._id,
        status: order.status,
        paymentStatus: order.paymentStatus,
        totalAmount: order.totalAmount,
        currency: order.currency,
        createdAt: order.createdAt,
        completedAt: order.completedAt,
      },
      "Payment status retrieved successfully"
    );
  } catch (err) {
    console.error("Error getting payment status:", err);
    return responseHelper.serverError(res, "Failed to get payment status");
  }
};
