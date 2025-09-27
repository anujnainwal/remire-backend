import { Request, Response } from "express";
import StaffModel from "../models/Staff.model";
import PermissionModel from "../models/Permission.model";
import RoleModel from "../models/Role.model";
import AuthModel from "../../auth/models/Auth.model";
import {
  staffLoginSchema,
  staffRegisterSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../validations/staffValidation";
import { responseHelper } from "../../../utils/responseHelper";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../../../utils/token.util";
import jwt from "jsonwebtoken";
import { AuthRequest } from "../../../middlewares/auth.middleware";

// Staff Login
export const staffLogin = async (req: Request, res: Response) => {
  try {
    // Validate input
    const parsed = staffLoginSchema.safeParse(req.body);
    if (!parsed.success) {
      return responseHelper.validationError(
        res,
        parsed.error.issues[0].message
      );
    }

    const { email, password } = parsed.data;

    // Find staff member
    const staff = await StaffModel.findOne({ email }).populate("permissions");
    if (!staff) {
      return responseHelper.unauthorized(res, "Invalid credentials");
    }

    // Check if staff is active
    if (!staff.isActive) {
      return responseHelper.unauthorized(res, "Account is deactivated");
    }

    // Verify password
    const isMatch = await staff.comparePassword(password);
    if (!isMatch) {
      return responseHelper.unauthorized(res, "Invalid credentials");
    }

    // Update last login
    staff.lastLogin = new Date();
    await staff.save();

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: staff._id,
      email: staff.email,
      role: staff.role,
      type: "staff",
    });

    const refreshToken = generateRefreshToken({
      userId: staff._id,
      email: staff.email,
      role: staff.role,
      type: "staff",
    });

    // Create or update auth session
    const userAgent = String(req.headers["user-agent"] || "");
    const deviceType = req.body.deviceType || "web";
    const deviceId = req.body.deviceId;

    const existingSession = await AuthModel.findOne({
      userId: staff._id,
      userAgent,
      deviceType,
    });

    if (existingSession) {
      existingSession.refreshToken = refreshToken;
      existingSession.ipAddress = req.ip;
      existingSession.fcmToken = req.body.fcmToken;
      existingSession.expiresAt = new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
      );
      existingSession.revoked = false;
      await existingSession.save();
    } else {
      await AuthModel.create({
        userId: staff._id,
        refreshToken,
        deviceId,
        deviceType,
        userAgent,
        ipAddress: req.ip,
        fcmToken: req.body.fcmToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        revoked: false,
      });
    }

    // Set cookies
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Remove sensitive data
    const staffResponse = staff.toObject();
    delete (staffResponse as any).password;
    delete (staffResponse as any).resetPasswordToken;
    delete (staffResponse as any).resetPasswordTokenExpire;

    return responseHelper.success(
      res,
      {
        staff: staffResponse,
        accessToken,
        refreshToken,
      },
      "Login successful"
    );
  } catch (error) {
    console.error("Staff login error:", error);
    return responseHelper.serverError(res, "Login failed");
  }
};

// Staff Registration (Only for super-admin and admin)
export const staffRegister = async (req: AuthRequest, res: Response) => {
  try {
    // Check if user has permission to create staff
    const requestingStaff = await StaffModel.findById(req.user?._id);
    if (
      !requestingStaff ||
      !["super-admin", "admin"].includes(requestingStaff.role)
    ) {
      return responseHelper.forbidden(res, "Insufficient permissions");
    }

    // Validate input
    const parsed = staffRegisterSchema.safeParse(req.body);
    if (!parsed.success) {
      return responseHelper.validationError(
        res,
        parsed.error.issues[0].message
      );
    }

    const { email, password, role, ...rest } = parsed.data;

    // Check if email already exists
    const existingStaff = await StaffModel.findOne({ email });
    if (existingStaff) {
      return responseHelper.error(res, "Email already registered");
    }

    // Prevent super-admin creation - only allow through special system setup
    if (role === "super-admin") {
      return responseHelper.forbidden(
        res,
        "Super-admin accounts cannot be created through this endpoint. Super-admin already exists."
      );
    }

    // Create new staff member
    const staff = new StaffModel({
      email,
      password,
      role: role || "agent",
      createdBy: requestingStaff._id,
      ...rest,
    });

    await staff.save();

    // Remove sensitive data
    const staffResponse = staff.toObject();
    delete (staffResponse as any).password;

    return responseHelper.created(
      res,
      { staff: staffResponse },
      "Staff member created successfully"
    );
  } catch (error) {
    console.error("Staff registration error:", error);
    return responseHelper.serverError(res, "Registration failed");
  }
};

// Change Password
export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    const parsed = changePasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      return responseHelper.validationError(
        res,
        parsed.error.issues[0].message
      );
    }

    const { currentPassword, newPassword } = parsed.data;
    const staffId = req.user?._id;

    const staff = await StaffModel.findById(staffId);
    if (!staff) {
      return responseHelper.notFound(res, "Staff member not found");
    }

    // Verify current password
    const isMatch = await staff.comparePassword(currentPassword);
    if (!isMatch) {
      return responseHelper.unauthorized(res, "Current password is incorrect");
    }

    // Update password
    staff.password = newPassword;
    await staff.save();

    return responseHelper.success(res, null, "Password changed successfully");
  } catch (error) {
    console.error("Change password error:", error);
    return responseHelper.serverError(res, "Password change failed");
  }
};

// Forgot Password
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const parsed = forgotPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      return responseHelper.validationError(
        res,
        parsed.error.issues[0].message
      );
    }

    const { email } = parsed.data;
    const staff = await StaffModel.findOne({ email });

    if (!staff) {
      return responseHelper.notFound(res, "Staff member not found");
    }

    // Generate reset token
    const resetToken = jwt.sign(
      { id: staff._id, type: "staff" },
      process.env.JWT_SECRET!,
      { expiresIn: "1h" }
    );

    staff.resetPasswordToken = resetToken;
    staff.resetPasswordTokenExpire = new Date(Date.now() + 60 * 60 * 1000);
    await staff.save();

    // TODO: Send email with reset token
    console.log(`Reset token for ${email}: ${resetToken}`);

    return responseHelper.success(res, null, "Password reset email sent");
  } catch (error) {
    console.error("Forgot password error:", error);
    return responseHelper.serverError(res, "Failed to send reset email");
  }
};

// Reset Password
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const parsed = resetPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      return responseHelper.validationError(
        res,
        parsed.error.issues[0].message
      );
    }

    const { token, password } = parsed.data;

    // Verify token
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    if (decoded.type !== "staff") {
      return responseHelper.unauthorized(res, "Invalid token type");
    }

    const staff = await StaffModel.findById(decoded.id);
    if (
      !staff ||
      staff.resetPasswordToken !== token ||
      !staff.resetPasswordTokenExpire ||
      staff.resetPasswordTokenExpire < new Date()
    ) {
      return responseHelper.unauthorized(res, "Invalid or expired reset token");
    }

    // Update password
    staff.password = password;
    staff.resetPasswordToken = undefined;
    staff.resetPasswordTokenExpire = undefined;
    await staff.save();

    return responseHelper.success(res, null, "Password reset successful");
  } catch (error) {
    console.error("Reset password error:", error);
    return responseHelper.serverError(res, "Password reset failed");
  }
};

// Staff Logout
export const staffLogout = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return responseHelper.badRequest(res, "Refresh token is required");
    }

    const authSession = await AuthModel.findOne({ refreshToken });
    if (!authSession) {
      return responseHelper.notFound(res, "Session not found");
    }

    authSession.revoked = true;
    authSession.revokedAt = new Date();
    await authSession.save();

    // Clear cookies
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    return responseHelper.success(res, null, "Logged out successfully");
  } catch (error) {
    console.error("Staff logout error:", error);
    return responseHelper.serverError(res, "Logout failed");
  }
};

// Get Staff Profile
export const getStaffProfile = async (req: AuthRequest, res: Response) => {
  try {
    const staffId = req.user?._id;
    const staff = await StaffModel.findById(staffId).populate("permissions");

    if (!staff) {
      return responseHelper.notFound(res, "Staff member not found");
    }

    const staffResponse = staff.toObject();
    delete (staffResponse as any).password;
    delete (staffResponse as any).resetPasswordToken;
    delete (staffResponse as any).resetPasswordTokenExpire;

    return responseHelper.success(
      res,
      { staff: staffResponse },
      "Profile retrieved"
    );
  } catch (error) {
    console.error("Get profile error:", error);
    return responseHelper.serverError(res, "Failed to retrieve profile");
  }
};
