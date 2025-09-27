import { Request, Response } from "express";
import GermanBlockedAccountModel from "../models/GermanBlockedAccount.model";
import { responseHelper } from "../../../utils/responseHelper";
import { AuthRequest } from "../../../middlewares/auth.middleware";
import germanBlockedAccountValidationSchema from "../validations/germanBlockedAccountValidation";

// Exchange rates (in a real app, this would come from an external API)
const EXCHANGE_RATES = {
  eur: 101.5, // EUR to INR rate
  usd: 83.5,
  gbp: 114.3,
  cad: 61.8,
  aud: 54.2,
};

export const createGermanBlockedAccountOrder = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.user && req.user._id;
    if (!userId) return responseHelper.unauthorized(res);

    const body = req.body || {};
    const parsed = germanBlockedAccountValidationSchema.safeParse(body);
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
      germanDetails,
      complianceDocuments,
    } = parsed.data;

    // Calculate exchange rate
    const exchangeRate =
      EXCHANGE_RATES[currency as keyof typeof EXCHANGE_RATES] || 1;

    // Debug logging
    console.log("German Blocked Account validation:", {
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

    const germanBlockedAccountOrder = new GermanBlockedAccountModel({
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
      germanDetails: germanDetails || {},
      complianceDocuments: complianceDocuments || {},
    });

    await germanBlockedAccountOrder.save();

    return responseHelper.created(
      res,
      germanBlockedAccountOrder,
      "German blocked account order created successfully"
    );
  } catch (err) {
    console.error("Error creating German blocked account order:", err);
    return responseHelper.serverError(
      res,
      "Failed to create German blocked account order"
    );
  }
};

export const getGermanBlockedAccountOrders = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.user && req.user._id;
    if (!userId) return responseHelper.unauthorized(res);

    const orders = await GermanBlockedAccountModel.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate("user", "email firstName lastName");

    return responseHelper.success(
      res,
      orders,
      "German blocked account orders fetched successfully"
    );
  } catch (err) {
    console.error("Error fetching German blocked account orders:", err);
    return responseHelper.serverError(
      res,
      "Failed to fetch German blocked account orders"
    );
  }
};

export const getGermanBlockedAccountOrder = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.user && req.user._id;
    if (!userId) return responseHelper.unauthorized(res);

    const { id } = req.params;
    const order = await GermanBlockedAccountModel.findOne({
      _id: id,
      user: userId,
    }).populate("user", "email firstName lastName");

    if (!order) {
      return responseHelper.notFound(
        res,
        "German blocked account order not found"
      );
    }

    return responseHelper.success(
      res,
      order,
      "German blocked account order fetched successfully"
    );
  } catch (err) {
    console.error("Error fetching German blocked account order:", err);
    return responseHelper.serverError(
      res,
      "Failed to fetch German blocked account order"
    );
  }
};

export const updateGermanBlockedAccountOrderStatus = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.user && req.user._id;
    if (!userId) return responseHelper.unauthorized(res);

    const { id } = req.params;
    const { status, kycStatus } = req.body;

    const order = await GermanBlockedAccountModel.findOneAndUpdate(
      { _id: id, user: userId },
      { status, kycStatus },
      { new: true }
    );

    if (!order) {
      return responseHelper.notFound(
        res,
        "German blocked account order not found"
      );
    }

    return responseHelper.success(
      res,
      order,
      "German blocked account order status updated successfully"
    );
  } catch (err) {
    console.error("Error updating German blocked account order status:", err);
    return responseHelper.serverError(
      res,
      "Failed to update German blocked account order status"
    );
  }
};

export const updateGermanDetails = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user && req.user._id;
    if (!userId) return responseHelper.unauthorized(res);

    const { id } = req.params;
    const germanDetails = req.body;

    const order = await GermanBlockedAccountModel.findOneAndUpdate(
      { _id: id, user: userId },
      { germanDetails },
      { new: true }
    );

    if (!order) {
      return responseHelper.notFound(
        res,
        "German blocked account order not found"
      );
    }

    return responseHelper.success(
      res,
      order,
      "German details updated successfully"
    );
  } catch (err) {
    console.error("Error updating German details:", err);
    return responseHelper.serverError(res, "Failed to update German details");
  }
};

export const updateComplianceDocuments = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.user && req.user._id;
    if (!userId) return responseHelper.unauthorized(res);

    const { id } = req.params;
    const complianceDocuments = req.body;

    const order = await GermanBlockedAccountModel.findOneAndUpdate(
      { _id: id, user: userId },
      { complianceDocuments },
      { new: true }
    );

    if (!order) {
      return responseHelper.notFound(
        res,
        "German blocked account order not found"
      );
    }

    return responseHelper.success(
      res,
      order,
      "Compliance documents updated successfully"
    );
  } catch (err) {
    console.error("Error updating compliance documents:", err);
    return responseHelper.serverError(
      res,
      "Failed to update compliance documents"
    );
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
