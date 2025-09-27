import { Request, Response } from "express";
import CreateGicAccountModel from "../models/CreateGicAccount.model";
import { responseHelper } from "../../../utils/responseHelper";
import { AuthRequest } from "../../../middlewares/auth.middleware";
import createGicAccountValidationSchema from "../validations/createGicAccountValidation";

export const createGicAccountRequest = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.user && req.user._id;
    if (!userId) return responseHelper.unauthorized(res);

    const body = req.body || {};
    const parsed = createGicAccountValidationSchema.safeParse(body);
    if (!parsed.success) {
      return responseHelper.validationError(
        res,
        parsed.error.issues[0].message
      );
    }

    const {
      firstName,
      lastName,
      mobileNumber,
      countryCode,
      email,
      blockedAccountPreference,
      offerLetter,
      passportCopy,
    } = parsed.data;

    const gicAccountRequest = new CreateGicAccountModel({
      user: userId,
      firstName,
      lastName,
      mobileNumber,
      countryCode,
      email,
      blockedAccountPreference,
      offerLetter,
      passportCopy,
      status: "pending",
    });

    await gicAccountRequest.save();

    return responseHelper.created(
      res,
      gicAccountRequest,
      "GIC account request created successfully. Our team will contact you shortly."
    );
  } catch (err) {
    console.error("Error creating GIC account request:", err);
    return responseHelper.serverError(
      res,
      "Failed to create GIC account request"
    );
  }
};

export const getGicAccountRequests = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.user && req.user._id;
    if (!userId) return responseHelper.unauthorized(res);

    const requests = await CreateGicAccountModel.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate("user", "email firstName lastName");

    return responseHelper.success(
      res,
      requests,
      "GIC account requests fetched successfully"
    );
  } catch (err) {
    console.error("Error fetching GIC account requests:", err);
    return responseHelper.serverError(
      res,
      "Failed to fetch GIC account requests"
    );
  }
};

export const getGicAccountRequest = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user && req.user._id;
    if (!userId) return responseHelper.unauthorized(res);

    const { id } = req.params;
    const request = await CreateGicAccountModel.findOne({
      _id: id,
      user: userId,
    }).populate("user", "email firstName lastName");

    if (!request) {
      return responseHelper.notFound(res, "GIC account request not found");
    }

    return responseHelper.success(
      res,
      request,
      "GIC account request fetched successfully"
    );
  } catch (err) {
    console.error("Error fetching GIC account request:", err);
    return responseHelper.serverError(
      res,
      "Failed to fetch GIC account request"
    );
  }
};

export const updateGicAccountRequestStatus = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.user && req.user._id;
    if (!userId) return responseHelper.unauthorized(res);

    const { id } = req.params;
    const { status, assignedAgent, notes } = req.body;

    const request = await CreateGicAccountModel.findOneAndUpdate(
      { _id: id, user: userId },
      { status, assignedAgent, notes },
      { new: true }
    );

    if (!request) {
      return responseHelper.notFound(res, "GIC account request not found");
    }

    return responseHelper.success(
      res,
      request,
      "GIC account request status updated successfully"
    );
  } catch (err) {
    console.error("Error updating GIC account request status:", err);
    return responseHelper.serverError(
      res,
      "Failed to update GIC account request status"
    );
  }
};

