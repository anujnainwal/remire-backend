import { Request, Response } from "express";
import { responseHelper } from "../../../utils/responseHelper";
import OrderModel from "../models/Order.model";
import CartModel from "../models/Cart.model";

// Razorpay webhook handler
export const razorpayWebhookController = async (
  req: Request,
  res: Response
) => {
  try {
    const event = req.body;

    console.log("Razorpay webhook event received:", {
      event: event.event,
      timestamp: new Date().toISOString(),
      paymentId: event.payload?.payment?.entity?.id,
      orderId: event.payload?.order?.entity?.id,
    });

    // Validate event structure
    if (!event.event || !event.payload) {
      console.error("Invalid webhook event structure:", event);
      return responseHelper.badRequest(res, "Invalid webhook event structure");
    }

    switch (event.event) {
      case "payment.captured":
        await handlePaymentCaptured(event);
        break;
      case "payment.failed":
        await handlePaymentFailed(event);
        break;
      case "order.paid":
        await handleOrderPaid(event);
        break;
      case "payment.authorized":
        await handlePaymentAuthorized(event);
        break;
      default:
        console.log("Unhandled webhook event:", event.event);
    }

    console.log("Webhook processed successfully for event:", event.event);
    return responseHelper.success(res, {}, "Webhook processed successfully");
  } catch (err) {
    console.error("Error processing webhook:", err);
    return responseHelper.serverError(res, "Failed to process webhook");
  }
};

// Handle payment captured event
const handlePaymentCaptured = async (event: any) => {
  try {
    const payment = event.payload.payment.entity;
    const orderId = payment.notes?.orderId || payment.order_id;

    if (!orderId) {
      console.error("No order ID found in payment notes or order_id");
      return;
    }

    const order = await OrderModel.findById(orderId);
    if (!order) {
      console.error("Order not found:", orderId);
      return;
    }

    // Update order status
    order.paymentId = payment.id;
    order.paymentStatus = "completed";
    order.status = "completed";
    order.completedAt = new Date();
    order.paymentDetails = {
      amount: payment.amount,
      currency: payment.currency,
      method: payment.method,
      bank: payment.bank,
      wallet: payment.wallet,
      vpa: payment.vpa,
      email: payment.email,
      contact: payment.contact,
    };
    await order.save();

    // Clear cart
    const cart = await CartModel.findById(order.cart);
    if (cart) {
      cart.status = "completed";
      cart.items = [];
      cart.subtotal = 0;
      cart.totalAmount = 0;
      await cart.save();
    }

    console.log("Payment captured and order completed:", {
      orderId,
      paymentId: payment.id,
      amount: payment.amount,
    });
  } catch (err) {
    console.error("Error handling payment captured:", err);
  }
};

// Handle payment failed event
const handlePaymentFailed = async (event: any) => {
  try {
    const payment = event.payload.payment.entity;
    const orderId = payment.notes?.orderId;

    if (!orderId) {
      console.error("No order ID found in payment notes");
      return;
    }

    const order = await OrderModel.findById(orderId);
    if (!order) {
      console.error("Order not found:", orderId);
      return;
    }

    // Update order status
    order.paymentStatus = "failed";
    order.status = "failed";
    order.failedAt = new Date();
    await order.save();

    console.log("Payment failed for order:", orderId);
  } catch (err) {
    console.error("Error handling payment failed:", err);
  }
};

// Handle order paid event
const handleOrderPaid = async (event: any) => {
  try {
    const order = event.payload.order.entity;
    const orderId = order.notes?.orderId;

    if (!orderId) {
      console.error("No order ID found in order notes");
      return;
    }

    const dbOrder = await OrderModel.findById(orderId);
    if (!dbOrder) {
      console.error("Order not found:", orderId);
      return;
    }

    // Update order status
    dbOrder.paymentStatus = "completed";
    dbOrder.status = "completed";
    dbOrder.completedAt = new Date();
    await dbOrder.save();

    // Clear cart
    const cart = await CartModel.findById(dbOrder.cart);
    if (cart) {
      cart.status = "completed";
      cart.items = [];
      cart.subtotal = 0;
      cart.totalAmount = 0;
      await cart.save();
    }

    console.log("Order paid and completed:", orderId);
  } catch (err) {
    console.error("Error handling order paid:", err);
  }
};

// Handle payment authorized event
const handlePaymentAuthorized = async (event: any) => {
  try {
    const payment = event.payload.payment.entity;
    const orderId = payment.notes?.orderId || payment.order_id;

    if (!orderId) {
      console.error("No order ID found in payment notes or order_id");
      return;
    }

    const order = await OrderModel.findById(orderId);
    if (!order) {
      console.error("Order not found:", orderId);
      return;
    }

    // Update order status to authorized (not yet captured)
    order.paymentId = payment.id;
    order.paymentStatus = "authorized";
    order.status = "processing";
    order.paymentDetails = {
      amount: payment.amount,
      currency: payment.currency,
      method: payment.method,
      bank: payment.bank,
      wallet: payment.wallet,
      vpa: payment.vpa,
      email: payment.email,
      contact: payment.contact,
    };
    await order.save();

    console.log("Payment authorized for order:", {
      orderId,
      paymentId: payment.id,
      amount: payment.amount,
    });
  } catch (err) {
    console.error("Error handling payment authorized:", err);
  }
};
