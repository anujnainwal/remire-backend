import { Request, Response } from "express";
import UserModel, { IUser } from "../../users/models/User.model";
import AuthModel from "../models/Auth.model";
import { responseHelper } from "../../../utils/responseHelper";
import { generateAccessToken, generateRefreshToken } from "../../../utils/token.util";

// Google OAuth Login/Signup
export const googleAuth = async (req: Request, res: Response) => {
  try {
    const { googleId, email, firstName, lastName, profilePicture } = req.body;

    if (!googleId || !email || !firstName || !lastName) {
      return responseHelper.validationError(res, "Missing required Google OAuth data");
    }

    // Check if user already exists
    let user = await UserModel.findOne({
      $or: [
        { email: email.toLowerCase() },
        { providerId: googleId, authProvider: "google" }
      ]
    });

    if (user) {
      // Update existing user if needed
      if (user.authProvider === "local") {
        // Convert local user to Google user
        user.authProvider = "google";
        user.providerId = googleId;
        user.profilePicture = profilePicture || user.profilePicture;
        user.isVerified = true; // Social login users are always verified
        await user.save();
      }
    } else {
      // Create new user
      user = await UserModel.create({
        firstname: firstName,
        lastname: lastName,
        email: email.toLowerCase(),
        authProvider: "google",
        providerId: googleId,
        profilePicture: profilePicture || null,
        isVerified: true, // Social login users are always verified
        isActive: true,
        acceptLegal: true, // Assume they accept legal terms through OAuth
      });
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

    // Save or update login session
    const loginUserAgent = String(req.headers["user-agent"] || "");
    const loginDeviceType = req.body.deviceType || "web";
    const deviceId = req.body.deviceId;

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

    // Set cookies
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

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

    return responseHelper.success(res, {
      userInfo: userResponse,
      accessToken: accessToken,
      refreshToken: refreshToken
    }, "Google authentication successful");

  } catch (error) {
    console.error("Google auth error:", error);
    return responseHelper.serverError(res, "Google authentication failed");
  }
};

// Facebook OAuth Login/Signup
export const facebookAuth = async (req: Request, res: Response) => {
  try {
    const { facebookId, email, firstName, lastName, profilePicture } = req.body;

    if (!facebookId || !email || !firstName || !lastName) {
      return responseHelper.validationError(res, "Missing required Facebook OAuth data");
    }

    // Check if user already exists
    let user = await UserModel.findOne({
      $or: [
        { email: email.toLowerCase() },
        { providerId: facebookId, authProvider: "facebook" }
      ]
    });

    if (user) {
      // Update existing user if needed
      if (user.authProvider === "local") {
        // Convert local user to Facebook user
        user.authProvider = "facebook";
        user.providerId = facebookId;
        user.profilePicture = profilePicture || user.profilePicture;
        user.isVerified = true; // Social login users are always verified
        await user.save();
      }
    } else {
      // Create new user
      user = await UserModel.create({
        firstname: firstName,
        lastname: lastName,
        email: email.toLowerCase(),
        authProvider: "facebook",
        providerId: facebookId,
        profilePicture: profilePicture || null,
        isVerified: true, // Social login users are always verified
        isActive: true,
        acceptLegal: true, // Assume they accept legal terms through OAuth
      });
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

    // Save or update login session
    const loginUserAgent = String(req.headers["user-agent"] || "");
    const loginDeviceType = req.body.deviceType || "web";
    const deviceId = req.body.deviceId;

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

    // Set cookies
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

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

    return responseHelper.success(res, {
      userInfo: userResponse,
      accessToken: accessToken,
      refreshToken: refreshToken
    }, "Facebook authentication successful");

  } catch (error) {
    console.error("Facebook auth error:", error);
    return responseHelper.serverError(res, "Facebook authentication failed");
  }
};
