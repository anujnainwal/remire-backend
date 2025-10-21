import { Request, Response } from "express";
import UserModel from "../../users/models/User.model";
import AuthModel from "../models/Auth.model";
import jwt from "jsonwebtoken";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../validations/authValidation";
import { responseHelper } from "../../../utils/responseHelper";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../../../utils/token.util";

export const register = async (req: Request, res: Response) => {
  console.log("singup-> body:- ",req.body)
  try {
    // 1️⃣ Validate input with Zod
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return responseHelper.validationError(res, firstError.message, req);
    }

    const { email, password, timezone, deviceId, ...rest } = parsed.data as any;

    // 2️⃣ Check if email already exists
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return responseHelper.error(res, "Email already registered", 400, req);
    }

    // 4️⃣ Create new user
    const user = new UserModel({ email, password, timezone, ...rest });
    await user.save();

    // 5️⃣ Create or update registration session (reuse if same userAgent)
    const userAgent = String(req.headers["user-agent"] || "");
    const deviceType = req.body.deviceType || "web";
    const existingSession = await AuthModel.findOne({
      userId: user._id,
      userAgent,
      deviceType,
    });

    if (existingSession) {
      existingSession.ipAddress = req.ip;
      existingSession.fcmToken = req.body.fcmToken;
      existingSession.refreshToken = "";
      existingSession.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      existingSession.revoked = false;
      await existingSession.save();
    } else {
      await AuthModel.create({
        userId: user._id,
        deviceType,
        deviceId,
        userAgent,
        ipAddress: req.ip,
        fcmToken: req.body.fcmToken,
        refreshToken: null,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day
        revoked: false,
      });
    }

    // 6️⃣ Generate tokens
    const accessToken = generateAccessToken({
      userId: user._id,
      email: user.email,
      role: user.role,
    });
    const refreshToken = generateRefreshToken({
      userId: user._id,
      email: user.email,
      role: user.role,
    });

    // Set secure HTTP-only cookies
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    return responseHelper.created(
      res,
      {
        userInfo: userResponse,
        accessToken: accessToken,
        refreshToken: refreshToken
      },
      "Registration successful"
    );
  } catch (err) {
    console.error("Registration Error:", err);
    return responseHelper.serverError(res, "Registration failed", req);
  }
};
// Login Controller
export const login = async (req: Request, res: Response) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return responseHelper.validationError(
        res,
        parsed.error.issues[0].message,
        req
      );
    }
    const { email, password, timezone, deviceId } = parsed.data as any;
    const user = await UserModel.findOne({ email });
    if (!user || !user.password) {
      return responseHelper.unauthorized(res, "Invalid credentials", req);
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return responseHelper.unauthorized(res, "Invalid credentials", req);
    }
    // Update timezone if provided
    if (timezone && timezone !== user.timezone) {
      user.timezone = timezone;
      await user.save();
    }
    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user._id,
      email: user.email,
      role: user.role,
    });
    const refreshToken = generateRefreshToken({
      userId: user._id,
      email: user.email,
      role: user.role,
    });
    // Save or update login session in AuthModel (reuse session if same userAgent)
    const loginUserAgent = String(req.headers["user-agent"] || "");
    const loginDeviceType = req.body.deviceType || "web";
    const loginSession = await AuthModel.findOne({
      userId: user._id,
      userAgent: loginUserAgent,
      deviceType: loginDeviceType,
    });

    if (loginSession) {
      loginSession.refreshToken = refreshToken;
      loginSession.deviceId = deviceId;
      loginSession.ipAddress = req.ip;
      loginSession.fcmToken = req.body.fcmToken;
      loginSession.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      loginSession.revoked = false;
      await loginSession.save();
    } else {
      await AuthModel.create({
        userId: user._id,
        refreshToken,
        deviceId: deviceId,
        deviceType: loginDeviceType,
        userAgent: loginUserAgent,
        ipAddress: req.ip,
        fcmToken: req.body.fcmToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        revoked: false,
      });
    }

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true, // 🔒 prevents JavaScript access (XSS protection)
      secure: process.env.NODE_ENV === "production", // only over HTTPS in prod
      sameSite: "none", // CSRF protection (none | lax | none)

      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });
    // Set secure HTTP-only cookies
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.resetPasswordToken;
    delete userResponse.resetPasswordTokenExpire;

    return responseHelper.success(res,  {
        userInfo: userResponse,
        accessToken: accessToken,
        refreshToken: refreshToken
      }, "Login successful");
  } catch (err) {
    return responseHelper.serverError(res, "Login failed", req);
  }
};

// Forgot Password Controller
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    let safeBody = req.body ?? {};
    const parsed = forgotPasswordSchema.safeParse(safeBody);
    if (!parsed.success) {
      return responseHelper.validationError(
        res,
        parsed.error.issues[0].message,
        req
      );
    }
    const { email } = parsed.data;
    const user = await UserModel.findOne({ email });
    if (!user) {
      return responseHelper.notFound(res, "User not found", req);
    }
    // Generate reset token
    const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET!, {
      expiresIn: "1h",
    });
    user.resetPasswordToken = resetToken;
    user.resetPasswordTokenExpire = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();
    // TODO: Send email with resetToken (implement email service)
    return responseHelper.success(res, null, "Password reset email sent");
  } catch (err) {
    return responseHelper.serverError(res, "Failed to send reset email", req);
  }
};

// Reset Password Controller
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const parsed = resetPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      return responseHelper.validationError(
        res,
        parsed.error.issues[0].message,
        req
      );
    }
    const { password, token } = parsed.data;
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    const user = await UserModel.findById(decoded.id);
    if (
      !user ||
      user.resetPasswordToken !== token ||
      !user.resetPasswordTokenExpire ||
      user.resetPasswordTokenExpire < new Date()
    ) {
      return responseHelper.unauthorized(res, "Invalid or expired reset token", req);
    }
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordTokenExpire = undefined;
    await user.save();
    return responseHelper.success(res, null, "Password reset successful");
  } catch (err) {
    return responseHelper.serverError(res, "Password reset failed", req);
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const body = req.body || {};
    const { refreshToken } = body;

    if (!refreshToken || typeof refreshToken !== "string") {
      return responseHelper.badRequest(res, "Refresh token is required", req);
    }

    const authSession = await AuthModel.findOne({ refreshToken });
    if (!authSession) {
      return responseHelper.notFound(
        res,
        "Session not found or already logged out",
        req
      );
    }

    authSession.revoked = true;
    authSession.revokedAt = new Date();
    await authSession.save();

    return responseHelper.success(res, null, "Logged out successfully");
  } catch (err: any) {
    console.error("Logout error:", err);
    return responseHelper.serverError(res, "Logout failed, please try again", req);
  }
};

// Refresh Access Token Controller
export const refreshAccessToken = async (req: Request, res: Response) => {
  try {
    // Try cookie, body or Authorization header
    const token =
      (req.cookies && req.cookies.refreshToken) ||
      (req.body && req.body.refreshToken) ||
      (req.headers.authorization &&
        String(req.headers.authorization).split(" ")[1]);

    if (!token || typeof token !== "string") {
      return responseHelper.unauthorized(res, "Refresh token required", req);
    }

    // Verify refresh token
    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET!);
    } catch (err) {
      return responseHelper.unauthorized(
        res,
        "Invalid or expired refresh token",
        req
      );
    }

    // Ensure session exists and is active
    const authSession = await AuthModel.findOne({ refreshToken: token });
    if (!authSession || !authSession.isActive()) {
      return responseHelper.unauthorized(res, "Session not found or inactive", req);
    }

    // Build payload and issue new access token
    const payload = {
      userId: (decoded as any).userId || (decoded as any).id,
      email: (decoded as any).email,
      role: (decoded as any).role,
    };

    const accessToken = generateAccessToken(payload);

    // Set access token cookie (short lived)
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    return responseHelper.success(res, null, "Access token refreshed");
  } catch (err) {
    console.error("Refresh token error:", err);
    return responseHelper.serverError(res, "Failed to refresh access token", req);
  }
};
