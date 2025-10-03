import { Request, Response } from "express";
import GicPaymentModel from "../models/GicPayment.model";
import { responseHelper } from "../../../utils/responseHelper";
import { AuthRequest } from "../../../middlewares/auth.middleware";
import gicPaymentValidationSchema from "../validations/gicPaymentValidation";

// Exchange rates (in a real app, this would come from an external API)
const EXCHANGE_RATES = {
  cad: 61.0, // CAD to INR rate
  usd: 83.5,
  eur: 101.5,
  gbp: 114.3,
  aud: 54.2,
};

export const createGicPaymentOrder = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.user && req.user._id;
    if (!userId) return responseHelper.unauthorized(res);

    // Handle multipart form data
    const body = req.body || {};
    
    // Convert string values to appropriate types for validation
    const formData = {
      fromCountry: body.fromCountry ? parseInt(body.fromCountry) : undefined,
      fromState: body.fromState ? parseInt(body.fromState) : undefined,
      fromCity: body.fromCity ? parseInt(body.fromCity) : undefined,
      transferTo: body.transferTo,
      purpose: body.purpose,
      currency: body.currency,
      amount: body.amount ? parseFloat(body.amount) : undefined,
      total: body.total ? parseFloat(body.total) : undefined,
      canadianDetails: {
        universityName: body.universityName,
        programOfStudy: body.programOfStudy,
        intake: body.intake,
        expectedDuration: body.expectedDuration,
        passportNumber: body.passportNumber,
        visaType: body.visaType,
        bankAccountNumber: body.bankAccountNumber,
        ifscCode: body.ifscCode,
        gicProvider: body.gicProvider,
      },
    };

    const parsed = gicPaymentValidationSchema.safeParse(formData);
    if (!parsed.success) {
      return responseHelper.validationError(
        res,
        parsed.error.issues[0].message
      );
    }

    const {
      fromCountry,
      fromState,
      fromCity,
      transferTo,
      purpose,
      currency,
      amount,
      total,
      canadianDetails,
    } = parsed.data;

    // Handle uploaded files
    const files = req.files as Express.Multer.File[] | undefined;
    const complianceDocuments: any = {};
    
    if (files && files.length > 0) {
      files.forEach(file => {
        const fieldName = file.fieldname;
        if (fieldName.startsWith('compliance_')) {
          const docType = fieldName.replace('compliance_', '');
          if (!complianceDocuments[docType]) {
            complianceDocuments[docType] = [];
          }
          complianceDocuments[docType].push({
            originalName: file.originalname,
            filename: file.filename,
            path: file.path,
            size: file.size,
            mimetype: file.mimetype
          });
        }
      });
    }

    // Calculate exchange rate
    const exchangeRate =
      EXCHANGE_RATES[currency as keyof typeof EXCHANGE_RATES] || 1;

    // Debug logging
    console.log("GIC Payment validation:", {
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

    const gicPaymentOrder = new GicPaymentModel({
      user: userId,
      fromCountry,
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
      canadianDetails: canadianDetails || {},
      complianceDocuments: complianceDocuments || {},
    });

    await gicPaymentOrder.save();

    return responseHelper.created(
      res,
      gicPaymentOrder,
      "GIC payment order created successfully"
    );
  } catch (err) {
    console.error("Error creating GIC payment order:", err);
    return responseHelper.serverError(
      res,
      "Failed to create GIC payment order"
    );
  }
};

export const getGicPaymentOrders = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user && req.user._id;
    if (!userId) return responseHelper.unauthorized(res);

    const orders = await GicPaymentModel.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate("user", "email firstName lastName");

    return responseHelper.success(
      res,
      orders,
      "GIC payment orders fetched successfully"
    );
  } catch (err) {
    console.error("Error fetching GIC payment orders:", err);
    return responseHelper.serverError(
      res,
      "Failed to fetch GIC payment orders"
    );
  }
};

export const getGicPaymentOrder = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user && req.user._id;
    if (!userId) return responseHelper.unauthorized(res);

    const { id } = req.params;
    const order = await GicPaymentModel.findOne({
      _id: id,
      user: userId,
    }).populate("user", "email firstName lastName");

    if (!order) {
      return responseHelper.notFound(res, "GIC payment order not found");
    }

    return responseHelper.success(
      res,
      order,
      "GIC payment order fetched successfully"
    );
  } catch (err) {
    console.error("Error fetching GIC payment order:", err);
    return responseHelper.serverError(res, "Failed to fetch GIC payment order");
  }
};

export const updateGicPaymentOrderStatus = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.user && req.user._id;
    if (!userId) return responseHelper.unauthorized(res);

    const { id } = req.params;
    const { status, kycStatus } = req.body;

    const order = await GicPaymentModel.findOneAndUpdate(
      { _id: id, user: userId },
      { status, kycStatus },
      { new: true }
    );

    if (!order) {
      return responseHelper.notFound(res, "GIC payment order not found");
    }

    return responseHelper.success(
      res,
      order,
      "GIC payment order status updated successfully"
    );
  } catch (err) {
    console.error("Error updating GIC payment order status:", err);
    return responseHelper.serverError(
      res,
      "Failed to update GIC payment order status"
    );
  }
};

export const updateCanadianDetails = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.user && req.user._id;
    if (!userId) return responseHelper.unauthorized(res);

    const { id } = req.params;
    const canadianDetails = req.body;

    const order = await GicPaymentModel.findOneAndUpdate(
      { _id: id, user: userId },
      { canadianDetails },
      { new: true }
    );

    if (!order) {
      return responseHelper.notFound(res, "GIC payment order not found");
    }

    return responseHelper.success(
      res,
      order,
      "Canadian details updated successfully"
    );
  } catch (err) {
    console.error("Error updating Canadian details:", err);
    return responseHelper.serverError(res, "Failed to update Canadian details");
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

    const order = await GicPaymentModel.findOneAndUpdate(
      { _id: id, user: userId },
      { complianceDocuments },
      { new: true }
    );

    if (!order) {
      return responseHelper.notFound(res, "GIC payment order not found");
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

