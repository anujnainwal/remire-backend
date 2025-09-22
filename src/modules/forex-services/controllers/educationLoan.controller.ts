import { Request, Response } from "express";
import EducationLoanModel from "../models/EducationLoan.model";
import { responseHelper } from "../../../utils/responseHelper";
import { AuthRequest } from "../../../middlewares/auth.middleware";
import educationLoanValidationSchema from "../validations/educationLoanValidation";

export const createEducationLoanRequest = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.user && req.user._id;
    if (!userId) return responseHelper.unauthorized(res);

    const body = req.body || {};
    const parsed = educationLoanValidationSchema.safeParse(body);
    if (!parsed.success) {
      return responseHelper.validationError(
        res,
        parsed.error.issues[0].message
      );
    }

    const {
      email,
      firstName,
      lastName,
      mobileNumber,
      studyCountry,
      instituteName,
      courseDetails,
      parentName,
      parentMobileNumber,
      loanAmount,
      loanPurpose,
      documents,
    } = parsed.data;

    const educationLoanRequest = new EducationLoanModel({
      user: userId,
      email,
      firstName,
      lastName,
      mobileNumber,
      studyCountry,
      instituteName,
      courseDetails,
      parentName,
      parentMobileNumber,
      loanAmount,
      loanPurpose,
      documents: documents || {},
      status: "pending",
    });

    await educationLoanRequest.save();

    return responseHelper.created(
      res,
      educationLoanRequest,
      "Education loan request created successfully. Our team will contact you shortly."
    );
  } catch (err) {
    console.error("Error creating education loan request:", err);
    return responseHelper.serverError(
      res,
      "Failed to create education loan request"
    );
  }
};

export const getEducationLoanRequests = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.user && req.user._id;
    if (!userId) return responseHelper.unauthorized(res);

    const requests = await EducationLoanModel.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate("user", "email firstName lastName");

    return responseHelper.success(
      res,
      requests,
      "Education loan requests fetched successfully"
    );
  } catch (err) {
    console.error("Error fetching education loan requests:", err);
    return responseHelper.serverError(
      res,
      "Failed to fetch education loan requests"
    );
  }
};

export const getEducationLoanRequest = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.user && req.user._id;
    if (!userId) return responseHelper.unauthorized(res);

    const { id } = req.params;
    const request = await EducationLoanModel.findOne({
      _id: id,
      user: userId,
    }).populate("user", "email firstName lastName");

    if (!request) {
      return responseHelper.notFound(res, "Education loan request not found");
    }

    return responseHelper.success(
      res,
      request,
      "Education loan request fetched successfully"
    );
  } catch (err) {
    console.error("Error fetching education loan request:", err);
    return responseHelper.serverError(
      res,
      "Failed to fetch education loan request"
    );
  }
};

export const updateEducationLoanRequestStatus = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.user && req.user._id;
    if (!userId) return responseHelper.unauthorized(res);

    const { id } = req.params;
    const { status, assignedAgent, notes, loanAmount, loanPurpose } = req.body;

    const request = await EducationLoanModel.findOneAndUpdate(
      { _id: id, user: userId },
      { status, assignedAgent, notes, loanAmount, loanPurpose },
      { new: true }
    );

    if (!request) {
      return responseHelper.notFound(res, "Education loan request not found");
    }

    return responseHelper.success(
      res,
      request,
      "Education loan request status updated successfully"
    );
  } catch (err) {
    console.error("Error updating education loan request status:", err);
    return responseHelper.serverError(
      res,
      "Failed to update education loan request status"
    );
  }
};

export const updateEducationLoanDocuments = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.user && req.user._id;
    if (!userId) return responseHelper.unauthorized(res);

    const { id } = req.params;
    const documents = req.body;

    const request = await EducationLoanModel.findOneAndUpdate(
      { _id: id, user: userId },
      { documents },
      { new: true }
    );

    if (!request) {
      return responseHelper.notFound(res, "Education loan request not found");
    }

    return responseHelper.success(
      res,
      request,
      "Education loan documents updated successfully"
    );
  } catch (err) {
    console.error("Error updating education loan documents:", err);
    return responseHelper.serverError(
      res,
      "Failed to update education loan documents"
    );
  }
};

