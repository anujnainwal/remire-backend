import { Request, Response } from "express";
import CreateGicAccountModel from "../models/CreateGicAccount.model";
import { responseHelper } from "../../../utils/responseHelper";
import { AuthRequest } from "../../../middlewares/auth.middleware";
import createGicAccountValidationSchema from "../validations/createGicAccountValidation";
import path from "path";
import fs from "fs";

export const createGicAccountRequest = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.user && req.user._id;
    if (!userId) return responseHelper.unauthorized(res);

    // Validate body data (excluding files)
    const body = req.body || {};
    const parsed = createGicAccountValidationSchema.safeParse(body);
    if (!parsed.success) {
      return responseHelper.validationError(
        res,
        parsed.error.issues[0].message
      );
    }

    // Check if files are uploaded
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    if (!files) {
      return responseHelper.validationError(
        res,
        "No files uploaded"
      );
    }

    // Check for required files
    if (!files.offerLetter || files.offerLetter.length === 0) {
      return responseHelper.validationError(
        res,
        "Offer letter is required"
      );
    }

    if (!files.passportCopy || files.passportCopy.length === 0) {
      return responseHelper.validationError(
        res,
        "Passport copy is required"
      );
    }

    const {
      firstName,
      lastName,
      mobileNumber,
      countryCode,
      email,
      blockedAccountPreference,
    } = parsed.data;

    // Process offer letter file
    const offerLetterFile = files.offerLetter[0];
    const offerLetterData = {
      originalName: offerLetterFile.originalname,
      fileName: offerLetterFile.filename,
      filePath: offerLetterFile.path,
      fileType: offerLetterFile.mimetype,
      fileSize: offerLetterFile.size,
      fileExtension: path.extname(offerLetterFile.originalname),
      fileCreatedAt: new Date(),
      fileUpdatedAt: new Date(),
    };

    // Process passport copy file
    const passportCopyFile = files.passportCopy[0];
    const passportCopyData = {
      originalName: passportCopyFile.originalname,
      fileName: passportCopyFile.filename,
      filePath: passportCopyFile.path,
      fileType: passportCopyFile.mimetype,
      fileSize: passportCopyFile.size,
      fileExtension: path.extname(passportCopyFile.originalname),
      fileCreatedAt: new Date(),
      fileUpdatedAt: new Date(),
    };

    const gicAccountRequest = new CreateGicAccountModel({
      user: userId,
      firstName,
      lastName,
      mobileNumber,
      countryCode,
      email,
      blockedAccountPreference,
      offerLetter: [offerLetterData],
      passportCopy: [passportCopyData],
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
    
    // Clean up uploaded files if there was an error
    if (req.files) {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      Object.values(files).forEach(fileArray => {
        fileArray.forEach(file => {
          try {
            if (fs.existsSync(file.path)) {
              fs.unlinkSync(file.path);
              console.log(`Deleted file: ${file.path}`);
            }
          } catch (deleteErr) {
            console.error(`Error deleting file ${file.path}:`, deleteErr);
          }
        });
      });
    }
    
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

