import { Request, Response } from "express";
import CreateGicAccountModel from "../models/CreateGicAccount.model";
import { responseHelper } from "../../../utils/responseHelper";
import { AuthRequest } from "../../../middlewares/auth.middleware";
import createGicAccountValidationSchema from "../validations/createGicAccountValidation";
import path from "path";
import fs from "fs";

// Helper function to check if user already has a GIC account request
export const checkUserGicAccountExists = async (userId: string): Promise<boolean> => {
  try {
    const existingRequest = await CreateGicAccountModel.findOne({ user: userId });
    return !!existingRequest;
  } catch (error) {
    console.error("Error checking GIC account existence:", error);
    return false;
  }
};

// Helper function to check if email is already used by another user
export const checkEmailExists = async (email: string, excludeUserId?: string): Promise<boolean> => {
  try {
    const normalizedEmail = email.toLowerCase().trim();
    const query: any = { email: normalizedEmail };
    if (excludeUserId) {
      query.user = { $ne: excludeUserId };
    }
    const existingRequest = await CreateGicAccountModel.findOne(query);
    return !!existingRequest;
  } catch (error) {
    console.error("Error checking email existence:", error);
    return false;
  }
};

// Helper function to check if phone number is already used by another user
export const checkPhoneNumberExists = async (mobileNumber: string, countryCode: string, excludeUserId?: string): Promise<boolean> => {
  try {
    const normalizedMobile = mobileNumber.trim();
    const normalizedCountryCode = countryCode.trim();
    const query: any = { 
      mobileNumber: normalizedMobile,
      countryCode: normalizedCountryCode
    };
    if (excludeUserId) {
      query.user = { $ne: excludeUserId };
    }
    const existingRequest = await CreateGicAccountModel.findOne(query);
    return !!existingRequest;
  } catch (error) {
    console.error("Error checking phone number existence:", error);
    return false;
  }
};

export const createGicAccountRequest = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.user && req.user._id;
    if (!userId) return responseHelper.unauthorized(res);

    // Check if user already has a GIC account request
    const hasExistingRequest = await checkUserGicAccountExists(userId);
    
    if (hasExistingRequest) {
      return responseHelper.badRequest(
        res,
        "You already have a GIC account request. Only one request per user is allowed."
      );
    }

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

    // Check if email is already used by any user (including current user)
    const emailExists = await checkEmailExists(email);
    if (emailExists) {
      return responseHelper.badRequest(
        res,
        "This email address is already registered with another GIC account request. Please use a different email address."
      );
    }

    // Check if phone number is already used by any user (including current user)
    const phoneExists = await checkPhoneNumberExists(mobileNumber, countryCode);
    if (phoneExists) {
      return responseHelper.badRequest(
        res,
        "This phone number is already registered with another GIC account request. Please use a different phone number."
      );
    }

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
  } catch (err: any) {
    console.error("Error creating GIC account request:", err);
    
    // Handle unique constraint violations
    if (err.code === 11000) {
      if (err.keyPattern?.user) {
        return responseHelper.badRequest(
          res,
          "You already have a GIC account request. Only one request per user is allowed."
        );
      }
      if (err.keyPattern?.email) {
        return responseHelper.badRequest(
          res,
          "This email address is already registered with another GIC account request. Please use a different email address."
        );
      }
      if (err.keyPattern?.mobileNumber) {
        return responseHelper.badRequest(
          res,
          "This phone number is already registered with another GIC account request. Please use a different phone number."
        );
      }
    }
    
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

// Check if user has existing GIC account request
export const checkGicAccountStatus = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.user && req.user._id;
    if (!userId) return responseHelper.unauthorized(res);

    const hasExistingRequest = await checkUserGicAccountExists(userId);
    
    if (hasExistingRequest) {
      // Get the existing request details
      const existingRequest = await CreateGicAccountModel.findOne({ user: userId })
        .select('status createdAt updatedAt')
        .lean();
      
      return responseHelper.success(
        res,
        {
          hasExistingRequest: true,
          status: existingRequest?.status,
          createdAt: existingRequest?.createdAt,
          updatedAt: existingRequest?.updatedAt,
        },
        "User has an existing GIC account request"
      );
    }

    return responseHelper.success(
      res,
      {
        hasExistingRequest: false,
        status: null,
        createdAt: null,
        updatedAt: null,
      },
      "User does not have any GIC account request"
    );
  } catch (error) {
    console.error("Error checking GIC account status:", error);
    return responseHelper.serverError(res, "Failed to check GIC account status");
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

