import { Response } from "express";
import { AuthRequest } from "../../../middlewares/auth.middleware";
import { responseHelper } from "../../../utils/responseHelper";
import OrderModel from "../models/Order.model";
import forexCurrencyValidationSchema from "../validations/forexCurrencyValidation";

export const createForexCurrencyOrder = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user && req.user._id;
    if (!userId) return responseHelper.unauthorized(res, "Authentication required", req);

    const body = req.body || {};
    const parsed = forexCurrencyValidationSchema.safeParse(body);
    if (!parsed.success) {
      return responseHelper.validationError(res, parsed.error.issues[0].message, req);
    }

    const data = parsed.data as any;

    // Uniqueness checks for email and mobile within forex-currency orders
    const normalizedEmail = String(data?.travelDetails?.email || "").toLowerCase().trim();
    const normalizedMobile = String(data?.travelDetails?.mobileNumber || "").trim();

    if (normalizedEmail) {
      const emailExists = await OrderModel.findOne({
        orderType: "forex-currency",
        "metadata.forexCurrency.travelDetails.email": normalizedEmail,
      }).lean();
      if (emailExists) {
        return responseHelper.badRequest(
          res,
          "This email address is already used in a forex currency order. Please use a different email.",
          req
        );
      }
    }

    if (normalizedMobile) {
      const mobileExists = await OrderModel.findOne({
        orderType: "forex-currency",
        "metadata.forexCurrency.travelDetails.mobileNumber": normalizedMobile,
      }).lean();
      if (mobileExists) {
        return responseHelper.badRequest(
          res,
          "This mobile number is already used in a forex currency order. Please use a different number.",
          req
        );
      }
    }

    const order = new OrderModel({
      user: userId,
      orderType: "forex-currency",
      totalAmount: data.equivalentAmount,
      currency: "INR",
      metadata: {
        forexCurrency: {
          ...data,
          travelDetails: {
            ...data.travelDetails,
            email: normalizedEmail || data.travelDetails?.email,
            mobileNumber: normalizedMobile || data.travelDetails?.mobileNumber,
          },
        },
      },
      trackingDetails: {
        currentStep: "order_created",
        completedSteps: ["order_created"],
        lastUpdated: new Date(),
      },
    });

    await order.save();
    return responseHelper.created(res, order, "Forex currency order created successfully");
  } catch (err) {
    console.error("Error creating forex currency order:", err);
    return responseHelper.serverError(res, "Failed to create forex currency order");
  }
};

export const getForexCurrencyOrders = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user && req.user._id;
    if (!userId) return responseHelper.unauthorized(res);

    const orders = await OrderModel.find({ user: userId, orderType: "forex-currency" })
      .sort({ createdAt: -1 });
    return responseHelper.success(res, orders, "Forex currency orders fetched successfully");
  } catch (err) {
    console.error("Error fetching forex currency orders:", err);
    return responseHelper.serverError(res, "Failed to fetch forex currency orders");
  }
};


