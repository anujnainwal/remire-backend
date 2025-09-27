import { Request, Response } from "express";
import NriRepatriationModel from "../models/NriRepatriation.model";
import { responseHelper } from "../../../utils/responseHelper";
import { AuthRequest } from "../../../middlewares/auth.middleware";
import nriRepatriationValidationSchema from "../validations/nriRepatriationValidation";

// Exchange rates (in a real app, this would come from an external API)
const EXCHANGE_RATES = {
  usd: 83.5,
  eur: 98.2,
  gbp: 114.3,
  cad: 61.8,
  aud: 54.2,
};

export const createNriRepatriationOrder = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.user && req.user._id;
    if (!userId) return responseHelper.unauthorized(res);

    const body = req.body || {};
    const parsed = nriRepatriationValidationSchema.safeParse(body);
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
      nriDetails,
      complianceDocuments,
    } = parsed.data;

    // Calculate exchange rate
    const exchangeRate =
      EXCHANGE_RATES[currency as keyof typeof EXCHANGE_RATES] || 1;

    // Debug logging
    console.log("NRI Repatriation validation:", {
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

    const nriRepatriationOrder = new NriRepatriationModel({
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
      nriDetails: nriDetails || {},
      complianceDocuments: complianceDocuments || {},
    });

    await nriRepatriationOrder.save();

    return responseHelper.created(
      res,
      nriRepatriationOrder,
      "NRI repatriation order created successfully"
    );
  } catch (err) {
    console.error("Error creating NRI repatriation order:", err);
    return responseHelper.serverError(
      res,
      "Failed to create NRI repatriation order"
    );
  }
};

export const getNriRepatriationOrders = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.user && req.user._id;
    if (!userId) return responseHelper.unauthorized(res);

    const orders = await NriRepatriationModel.find({ user: userId }).sort({
      createdAt: -1,
    });
    return responseHelper.success(
      res,
      orders,
      "NRI repatriation orders fetched successfully"
    );
  } catch (err) {
    console.error("Error fetching NRI repatriation orders:", err);
    return responseHelper.serverError(
      res,
      "Failed to fetch NRI repatriation orders"
    );
  }
};

export const getNriRepatriationOrder = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.user && req.user._id;
    if (!userId) return responseHelper.unauthorized(res);

    const orderId = req.params.id;
    const order = await NriRepatriationModel.findOne({
      _id: orderId,
      user: userId,
    });

    if (!order) {
      return responseHelper.notFound(res, "NRI repatriation order not found");
    }

    return responseHelper.success(
      res,
      order,
      "NRI repatriation order fetched successfully"
    );
  } catch (err) {
    console.error("Error fetching NRI repatriation order:", err);
    return responseHelper.serverError(
      res,
      "Failed to fetch NRI repatriation order"
    );
  }
};

export const updateNriRepatriationOrderStatus = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.user && req.user._id;
    if (!userId) return responseHelper.unauthorized(res);

    const orderId = req.params.id;
    const { status, kycStatus } = req.body;

    const order = await NriRepatriationModel.findOne({
      _id: orderId,
      user: userId,
    });
    if (!order) {
      return responseHelper.notFound(res, "NRI repatriation order not found");
    }

    if (status) order.status = status;
    if (kycStatus) order.kycStatus = kycStatus;

    await order.save();

    return responseHelper.success(
      res,
      order,
      "NRI repatriation order updated successfully"
    );
  } catch (err) {
    console.error("Error updating NRI repatriation order:", err);
    return responseHelper.serverError(
      res,
      "Failed to update NRI repatriation order"
    );
  }
};

export const updateNriDetails = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user && req.user._id;
    if (!userId) return responseHelper.unauthorized(res);

    const orderId = req.params.id;
    const { nriDetails } = req.body;

    const order = await NriRepatriationModel.findOne({
      _id: orderId,
      user: userId,
    });
    if (!order) {
      return responseHelper.notFound(res, "NRI repatriation order not found");
    }

    order.nriDetails = { ...order.nriDetails, ...nriDetails };
    await order.save();

    return responseHelper.success(
      res,
      order,
      "NRI details updated successfully"
    );
  } catch (err) {
    console.error("Error updating NRI details:", err);
    return responseHelper.serverError(res, "Failed to update NRI details");
  }
};

export const updateComplianceDocuments = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.user && req.user._id;
    if (!userId) return responseHelper.unauthorized(res);

    const orderId = req.params.id;
    const { complianceDocuments } = req.body;

    const order = await NriRepatriationModel.findOne({
      _id: orderId,
      user: userId,
    });
    if (!order) {
      return responseHelper.notFound(res, "NRI repatriation order not found");
    }

    order.complianceDocuments = {
      ...order.complianceDocuments,
      ...complianceDocuments,
    };
    await order.save();

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

export default {
  createNriRepatriationOrder,
  getNriRepatriationOrders,
  getNriRepatriationOrder,
  updateNriRepatriationOrderStatus,
  updateNriDetails,
  updateComplianceDocuments,
};

