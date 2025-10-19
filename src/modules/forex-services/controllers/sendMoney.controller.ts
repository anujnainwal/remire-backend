import { Request, Response } from "express";
import mongoose from "mongoose";
import SendMoneyModel from "../models/SendMoney.model";
import { responseHelper } from "../../../utils/responseHelper";
import { AuthRequest } from "../../../middlewares/auth.middleware";
import sendMoneyValidationSchema from "../validations/sendMoneyValidation";

// Exchange rates (in a real app, this would come from an external API)
const EXCHANGE_RATES = {
  usd: 83.5,  // 1 USD = 83.5 INR
  eur: 98.2,  // 1 EUR = 98.2 INR
  gbp: 114.3, // 1 GBP = 114.3 INR
  cad: 61.8,  // 1 CAD = 61.8 INR
  aud: 54.2,  // 1 AUD = 54.2 INR
};

export const createSendMoneyOrder = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user && req.user._id;
    if (!userId) return responseHelper.unauthorized(res);

    const body = req.body || {};
    const parsed = sendMoneyValidationSchema.safeParse(body);
    if (!parsed.success) {
      return responseHelper.validationError(
        res,
        parsed.error.issues[0].message
      );
    }

    const {
      fromState,
      fromCity,
      transferTo,
      purpose,
      currency,
      amount,
      total,
    } = parsed.data;

    // Calculate exchange rate
    const exchangeRate =
      EXCHANGE_RATES[currency as keyof typeof EXCHANGE_RATES] || 1;

    // Debug logging
    console.log("Backend validation:", {
      currency,
      amount,
      total,
      exchangeRate,
      calculatedTotal: amount * exchangeRate,
      difference: Math.abs(amount * exchangeRate - total),
    });

    // Verify the total matches the calculated amount
    const calculatedTotal = amount * exchangeRate;
    if (Math.abs(calculatedTotal - total) > 0.01) {
      return responseHelper.validationError(
        res,
        `Total amount does not match the calculated exchange rate. Expected: ${calculatedTotal}, Received: ${total}`
      );
    }

    const sendMoneyOrder = new SendMoneyModel({
      user: userId,
      fromState,
      fromCity,
      transferTo,
      purpose,
      currency,
      amount,
      total,
      exchangeRate,
      status: "pending",
      kycStatus: "pending",
    });

    await sendMoneyOrder.save();

    return responseHelper.created(
      res,
      sendMoneyOrder,
      "Send money order created successfully"
    );
  } catch (err) {
    console.error("Error creating send money order:", err);
    return responseHelper.serverError(res, "Failed to create send money order");
  }
};

export const getSendMoneyOrders = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user && req.user._id;
    if (!userId) return responseHelper.unauthorized(res);

    const orders = await SendMoneyModel.find({ user: userId }).sort({
      createdAt: -1,
    });
    return responseHelper.success(
      res,
      orders,
      "Send money orders fetched successfully"
    );
  } catch (err) {
    console.error("Error fetching send money orders:", err);
    return responseHelper.serverError(res, "Failed to fetch send money orders");
  }
};

export const getSendMoneyOrder = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user && req.user._id;
    if (!userId) return responseHelper.unauthorized(res);

    const orderId = req.params.id;
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return responseHelper.badRequest(res, "Invalid order ID");
    }

    const order = await SendMoneyModel.findOne({ _id: orderId, user: userId });

    if (!order) {
      return responseHelper.notFound(res, "Send money order not found");
    }

    return responseHelper.success(
      res,
      order,
      "Send money order fetched successfully"
    );
  } catch (err) {
    console.error("Error fetching send money order:", err);
    return responseHelper.serverError(res, "Failed to fetch send money order");
  }
};

export const updateSendMoneyOrderStatus = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.user && req.user._id;
    if (!userId) return responseHelper.unauthorized(res);

    const orderId = req.params.id;
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return responseHelper.badRequest(res, "Invalid order ID");
    }

    const { status, kycStatus } = req.body;

    const order = await SendMoneyModel.findOne({ _id: orderId, user: userId });
    if (!order) {
      return responseHelper.notFound(res, "Send money order not found");
    }

    if (status) order.status = status;
    if (kycStatus) order.kycStatus = kycStatus;

    await order.save();

    return responseHelper.success(
      res,
      order,
      "Send money order updated successfully"
    );
  } catch (err) {
    console.error("Error updating send money order:", err);
    return responseHelper.serverError(res, "Failed to update send money order");
  }
};

export const getExchangeRates = async (req: Request, res: Response) => {
  try {
    return responseHelper.success(
      res,
      EXCHANGE_RATES,
      "Exchange rates fetched successfully"
    );
  } catch (err) {
    console.error("Error fetching exchange rates:", err);
    return responseHelper.serverError(res, "Failed to fetch exchange rates");
  }
};

export default {
  createSendMoneyOrder,
  getSendMoneyOrders,
  getSendMoneyOrder,
  updateSendMoneyOrderStatus,
  getExchangeRates,
};
