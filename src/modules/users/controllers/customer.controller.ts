import { Response } from "express";
import UserModel from "../models/User.model";
import { responseHelper } from "../../../utils/responseHelper";
import { AuthRequest } from "../../../middlewares/auth.middleware";
import {
  createCustomerSchema,
  updateCustomerSchema,
  blockCustomerSchema,
  customerQuerySchema,
  updateCustomerPasswordSchema,
} from "../validations/customerValidation";
import mongoose from "mongoose";

// Helper function to check if user is super-admin or admin
const isAuthorized = async (userId: string): Promise<boolean> => {
  if (!userId) return false;

  const StaffModel = (await import("../../admin/models/Staff.model")).default;
  const staff = await StaffModel.findById(userId);

  return ["super-admin", "admin"].includes(staff?.role ?? "");
};

// Get all customers with pagination and filtering
export const getAllCustomers = async (req: AuthRequest, res: Response) => {
  try {
    // Check authorization
    if (!(await isAuthorized(req.user?._id || ""))) {
      return responseHelper.forbidden(res, "Insufficient permissions");
    }

    // Validate query parameters
    const parsed = customerQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return responseHelper.validationError(
        res,
        parsed.error.issues[0].message
      );
    }

    const { page, limit, search, status, kycStatus, country } = parsed.data;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter: any = {};

    // Search filter
    if (search) {
      filter.$or = [
        { firstname: { $regex: search, $options: "i" } },
        { lastname: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phoneNumber: { $regex: search, $options: "i" } },
      ];
    }

    // Status filter
    if (status === "active") {
      filter.isActive = true;
      filter.isBlocked = false;
    } else if (status === "inactive") {
      filter.isActive = false;
    } else if (status === "blocked") {
      filter.isBlocked = true;
    }

    // KYC status filter
    if (kycStatus !== "all") {
      filter.kycStatus = kycStatus;
    }

    // Country filter
    if (country) {
      filter.country = { $regex: country, $options: "i" };
    }

    // Get customers with pagination
    const customers = await UserModel.find(filter)
      .select("-password -resetPasswordToken -resetPasswordTokenExpire")
      .populate("blockedBy", "firstname lastname email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count
    const totalCustomers = await UserModel.countDocuments(filter);

    // Get status counts
    const statusCounts = await UserModel.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$isActive", true] },
                    { $eq: ["$isBlocked", false] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          inactive: {
            $sum: {
              $cond: [{ $eq: ["$isActive", false] }, 1, 0],
            },
          },
          blocked: {
            $sum: {
              $cond: [{ $eq: ["$isBlocked", true] }, 1, 0],
            },
          },
        },
      },
    ]);

    const pagination = {
      currentPage: page,
      totalPages: Math.ceil(totalCustomers / limit),
      totalItems: totalCustomers,
      itemsPerPage: limit,
    };

    return responseHelper.success(
      res,
      {
        customers,
        pagination,
        statusCounts: statusCounts[0] || {
          total: 0,
          active: 0,
          inactive: 0,
          blocked: 0,
        },
      },
      "Customers retrieved successfully"
    );
  } catch (error) {
    console.error("Get customers error:", error);
    return responseHelper.serverError(res, "Failed to retrieve customers");
  }
};

// Get single customer by ID
export const getCustomerById = async (req: AuthRequest, res: Response) => {
  try {
    // Check authorization
    if (!(await isAuthorized(req.user?._id || ""))) {
      return responseHelper.forbidden(res, "Insufficient permissions");
    }

    const { customerId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return responseHelper.badRequest(res, "Invalid customer ID");
    }

    const customer = await UserModel.findById(customerId)
      .select("-password -resetPasswordToken -resetPasswordTokenExpire")
      .populate("blockedBy", "firstname lastname email");

    if (!customer) {
      return responseHelper.notFound(res, "Customer not found");
    }

    return responseHelper.success(
      res,
      { customer },
      "Customer retrieved successfully"
    );
  } catch (error) {
    console.error("Get customer error:", error);
    return responseHelper.serverError(res, "Failed to retrieve customer");
  }
};

// Create new customer
export const createCustomer = async (req: AuthRequest, res: Response) => {
  try {
    // Check authorization
    if (!(await isAuthorized(req.user?._id || ""))) {
      return responseHelper.forbidden(res, "Insufficient permissions");
    }

    // Validate input
    const parsed = createCustomerSchema.safeParse(req.body);
    if (!parsed.success) {
      return responseHelper.validationError(
        res,
        parsed.error.issues[0].message
      );
    }

    const { email, ...customerData } = parsed.data;

    // Check if email already exists
    const existingCustomer = await UserModel.findOne({ email });
    if (existingCustomer) {
      return responseHelper.error(res, "Email already registered");
    }

    // Create new customer
    const customer = new UserModel({
      ...customerData,
      email,
      role: "customer",
      authProvider: "local",
      acceptLegal: true, // Admin created customers automatically accept legal terms
    });

    await customer.save();

    // Remove sensitive data
    const customerResponse = customer.toObject();
    delete customerResponse.password;
    delete customerResponse.resetPasswordToken;
    delete customerResponse.resetPasswordTokenExpire;

    return responseHelper.success(
      res,
      { customer: customerResponse },
      "Customer created successfully"
    );
  } catch (error) {
    console.error("Create customer error:", error);
    return responseHelper.serverError(res, "Failed to create customer");
  }
};

// Update customer
export const updateCustomer = async (req: AuthRequest, res: Response) => {
  try {
    // Check authorization
    if (!(await isAuthorized(req.user?._id || ""))) {
      return responseHelper.forbidden(res, "Insufficient permissions");
    }

    const { customerId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return responseHelper.badRequest(res, "Invalid customer ID");
    }

    // Validate input
    const parsed = updateCustomerSchema.safeParse(req.body);
    if (!parsed.success) {
      return responseHelper.validationError(
        res,
        parsed.error.issues[0].message
      );
    }

    const updateData = parsed.data;

    // Check if customer exists
    const existingCustomer = await UserModel.findById(customerId);
    if (!existingCustomer) {
      return responseHelper.notFound(res, "Customer not found");
    }

    // Check if email is being changed and if it already exists
    if (updateData.email && updateData.email !== existingCustomer.email) {
      const emailExists = await UserModel.findOne({
        email: updateData.email,
        _id: { $ne: customerId },
      });
      if (emailExists) {
        return responseHelper.error(res, "Email already registered");
      }
    }

    // Update customer
    const updatedCustomer = await UserModel.findByIdAndUpdate(
      customerId,
      updateData,
      { new: true, runValidators: true }
    ).select("-password -resetPasswordToken -resetPasswordTokenExpire");

    if (!updatedCustomer) {
      return responseHelper.notFound(res, "Customer not found");
    }

    return responseHelper.success(
      res,
      { customer: updatedCustomer },
      "Customer updated successfully"
    );
  } catch (error) {
    console.error("Update customer error:", error);
    return responseHelper.serverError(res, "Failed to update customer");
  }
};

// Block customer
export const blockCustomer = async (req: AuthRequest, res: Response) => {
  try {
    // Check authorization
    if (!(await isAuthorized(req.user?._id || ""))) {
      return responseHelper.forbidden(res, "Insufficient permissions");
    }

    const { customerId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return responseHelper.badRequest(res, "Invalid customer ID");
    }

    // Validate input
    const parsed = blockCustomerSchema.safeParse(req.body);
    if (!parsed.success) {
      return responseHelper.validationError(
        res,
        parsed.error.issues[0].message
      );
    }

    const { reason } = parsed.data;

    // Check if customer exists
    const customer = await UserModel.findById(customerId);
    if (!customer) {
      return responseHelper.notFound(res, "Customer not found");
    }

    // Block customer
    customer.isBlocked = true;
    customer.blockedReason = reason;
    customer.blockedAt = new Date();
    customer.blockedBy = new mongoose.Types.ObjectId(req.user?._id);
    customer.isActive = false; // Also deactivate the account

    await customer.save();

    // Remove sensitive data
    const customerResponse = customer.toObject();
    delete customerResponse.password;
    delete customerResponse.resetPasswordToken;
    delete customerResponse.resetPasswordTokenExpire;

    return responseHelper.success(
      res,
      { customer: customerResponse },
      "Customer blocked successfully"
    );
  } catch (error) {
    console.error("Block customer error:", error);
    return responseHelper.serverError(res, "Failed to block customer");
  }
};

// Unblock customer
export const unblockCustomer = async (req: AuthRequest, res: Response) => {
  try {
    // Check authorization
    if (!(await isAuthorized(req.user?._id || ""))) {
      return responseHelper.forbidden(res, "Insufficient permissions");
    }

    const { customerId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return responseHelper.badRequest(res, "Invalid customer ID");
    }

    // Check if customer exists
    const customer = await UserModel.findById(customerId);
    if (!customer) {
      return responseHelper.notFound(res, "Customer not found");
    }

    // Unblock customer
    customer.isBlocked = false;
    customer.blockedReason = undefined;
    customer.blockedAt = undefined;
    customer.blockedBy = undefined;
    customer.isActive = true; // Reactivate the account

    await customer.save();

    // Remove sensitive data
    const customerResponse = customer.toObject();
    delete customerResponse.password;
    delete customerResponse.resetPasswordToken;
    delete customerResponse.resetPasswordTokenExpire;

    return responseHelper.success(
      res,
      { customer: customerResponse },
      "Customer unblocked successfully"
    );
  } catch (error) {
    console.error("Unblock customer error:", error);
    return responseHelper.serverError(res, "Failed to unblock customer");
  }
};

// Delete customer
export const deleteCustomer = async (req: AuthRequest, res: Response) => {
  try {
    // Check authorization
    if (!(await isAuthorized(req.user?._id || ""))) {
      return responseHelper.forbidden(res, "Insufficient permissions");
    }

    const { customerId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return responseHelper.badRequest(res, "Invalid customer ID");
    }

    // Check if customer exists
    const customer = await UserModel.findById(customerId);
    if (!customer) {
      return responseHelper.notFound(res, "Customer not found");
    }

    // Delete customer
    await UserModel.findByIdAndDelete(customerId);

    return responseHelper.success(res, {}, "Customer deleted successfully");
  } catch (error) {
    console.error("Delete customer error:", error);
    return responseHelper.serverError(res, "Failed to delete customer");
  }
};

// Update customer password
export const updateCustomerPassword = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    // Check authorization
    if (!(await isAuthorized(req.user?._id || ""))) {
      return responseHelper.forbidden(res, "Insufficient permissions");
    }

    const { customerId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return responseHelper.badRequest(res, "Invalid customer ID");
    }

    // Validate input
    const parsed = updateCustomerPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      return responseHelper.validationError(
        res,
        parsed.error.issues[0].message
      );
    }

    const { password } = parsed.data;

    // Check if customer exists
    const customer = await UserModel.findById(customerId);
    if (!customer) {
      return responseHelper.notFound(res, "Customer not found");
    }

    // Update password
    customer.password = password;
    await customer.save();

    return responseHelper.success(
      res,
      {},
      "Customer password updated successfully"
    );
  } catch (error) {
    console.error("Update customer password error:", error);
    return responseHelper.serverError(
      res,
      "Failed to update customer password"
    );
  }
};

// Revoke customer access (soft delete - deactivate account)
export const revokeCustomerAccess = async (req: AuthRequest, res: Response) => {
  try {
    // Check authorization
    if (!(await isAuthorized(req.user?._id || ""))) {
      return responseHelper.forbidden(res, "Insufficient permissions");
    }

    const { customerId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return responseHelper.badRequest(res, "Invalid customer ID");
    }

    // Check if customer exists
    const customer = await UserModel.findById(customerId);
    if (!customer) {
      return responseHelper.notFound(res, "Customer not found");
    }

    // Revoke access (deactivate account)
    customer.isActive = false;
    customer.isBlocked = true;
    customer.blockedReason = "Access revoked by administrator";
    customer.blockedAt = new Date();
    customer.blockedBy = new mongoose.Types.ObjectId(req.user?._id);

    await customer.save();

    // Remove sensitive data
    const customerResponse = customer.toObject();
    delete customerResponse.password;
    delete customerResponse.resetPasswordToken;
    delete customerResponse.resetPasswordTokenExpire;

    return responseHelper.success(
      res,
      { customer: customerResponse },
      "Customer access revoked successfully"
    );
  } catch (error) {
    console.error("Revoke customer access error:", error);
    return responseHelper.serverError(res, "Failed to revoke customer access");
  }
};
