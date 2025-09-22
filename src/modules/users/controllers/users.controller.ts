import { Request, Response } from "express";
import UserModel from "../models/User.model";
import { responseHelper } from "../../../utils/responseHelper";
import { AuthRequest } from "../../../middlewares/auth.middleware";
import updateProfileSchema from "../validations/userValidation";

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user && req.user._id;
    if (!userId)
      return responseHelper.unauthorized(res, "Authentication required");

    const user = await UserModel.findById(userId).select(
      "-password -resetPasswordToken -resetPasswordTokenExpire"
    );
    if (!user) return responseHelper.notFound(res, "User not found");
    return responseHelper.success(res, user, "Profile fetched");
  } catch (err) {
    return responseHelper.serverError(res, "Failed to fetch profile");
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user && req.user._id;
    if (!userId)
      return responseHelper.unauthorized(res, "Authentication required");

    const updates = req.body || {};
    const parsed = updateProfileSchema.safeParse(updates);
    if (!parsed.success)
      return responseHelper.validationError(
        res,
        parsed.error.issues[0].message
      );

    const validUpdates: any = parsed.data as any;
    // prevent updating of protected fields
    delete validUpdates.password;
    delete validUpdates.email;
    delete validUpdates.role;

    const updated = await UserModel.findByIdAndUpdate(
      userId,
      { $set: validUpdates },
      { new: true }
    ).select("-password -resetPasswordToken -resetPasswordTokenExpire");

    if (!updated) return responseHelper.notFound(res, "User not found");
    return responseHelper.success(res, updated, "Profile updated");
  } catch (err) {
    return responseHelper.serverError(res, "Failed to update profile");
  }
};

export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user && req.user._id;
    if (!userId)
      return responseHelper.unauthorized(res, "Authentication required");
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword)
      return responseHelper.validationError(
        res,
        "Both current and new passwords are required"
      );

    const user = await UserModel.findById(userId);
    if (!user || !user.password)
      return responseHelper.notFound(res, "User not found or password not set");

    const match = await user.comparePassword(currentPassword);
    if (!match)
      return responseHelper.unauthorized(res, "Current password is incorrect");

    user.password = newPassword;
    await user.save();
    return responseHelper.success(res, null, "Password changed successfully");
  } catch (err) {
    return responseHelper.serverError(res, "Failed to change password");
  }
};

export const updateSettings = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user && req.user._id;
    if (!userId)
      return responseHelper.unauthorized(res, "Authentication required");
    const { timezone, phoneVerified } = req.body || {};
    const updates: any = {};
    if (timezone) updates.timezone = timezone;
    if (typeof phoneVerified === "boolean")
      updates.phoneVerified = phoneVerified;

    const updated = await UserModel.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true }
    ).select("-password -resetPasswordToken -resetPasswordTokenExpire");
    return responseHelper.success(res, updated, "Settings updated");
  } catch (err) {
    return responseHelper.serverError(res, "Failed to update settings");
  }
};

export default { getProfile, updateProfile };
