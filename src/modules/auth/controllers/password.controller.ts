import { Request, Response } from "express";
import UserModel from "../../users/models/User.model";
import jwt from "jsonwebtoken";
import { responseHelper } from "../../../utils/responseHelper";
import emailService from "../../../services/third-party/email/nodemailer.service";
import {
  resetPasswordTemplate,
  buildTemplatePayload,
} from "../../../services/third-party/email/templates";

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) return responseHelper.validationError(res, "Email is required");
    const user = await UserModel.findOne({ email });
    if (!user) return responseHelper.notFound(res, "User not found");

    // Token expires in 5 minutes
    const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET!, {
      expiresIn: "5m",
    });
    user.resetPasswordToken = resetToken;
    user.resetPasswordTokenExpire = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    await user.save();

    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
    const tpl = resetPasswordTemplate({
      name: user.firstname || user.email,
      resetUrl,
      expiresIn: "5 minutes",
    });
    const payload = buildTemplatePayload(tpl);

    try {
      await emailService.sendMail({ to: user.email, ...payload });
    } catch (err) {
      // Log but don't leak transport errors to clients
      console.error("Failed sending reset email", err);
    }

    return responseHelper.success(
      res,
      null,
      "Password reset email sent if the account exists"
    );
  } catch (err) {
    return responseHelper.serverError(res, "Failed to process forgot password");
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;
    if (!token || !password)
      return responseHelper.validationError(res, "Token and password required");

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    const user = await UserModel.findById(decoded.id);
    if (!user) return responseHelper.notFound(res, "User not found");
    if (
      user.resetPasswordToken !== token ||
      !user.resetPasswordTokenExpire ||
      user.resetPasswordTokenExpire < new Date()
    ) {
      return responseHelper.unauthorized(res, "Invalid or expired reset token");
    }

    user.password = password;
    user.resetPasswordToken = undefined as any;
    user.resetPasswordTokenExpire = undefined as any;
    await user.save();
    return responseHelper.success(res, null, "Password reset successful");
  } catch (err) {
    return responseHelper.serverError(res, "Password reset failed");
  }
};
