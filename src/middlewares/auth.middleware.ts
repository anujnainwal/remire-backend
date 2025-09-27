import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import UserModel from "../modules/users/models/User.model";
import StaffModel from "../modules/admin/models/Staff.model";
import { responseHelper } from "../utils/responseHelper";

export interface AuthRequest extends Request {
  user?: any;
}

export const authGuard = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token =
      req.cookies?.accessToken || req.headers.authorization?.split(" ")?.[1];
    if (!token)
      return responseHelper.unauthorized(res, "Authentication token missing");

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    if (!decoded?.userId && !decoded?.id)
      return responseHelper.unauthorized(res, "Invalid token payload");

    const userId = decoded.userId || decoded.id;
    const userType = decoded.type || "customer";

    if (userType === "staff") {
      const staff = await StaffModel.findById(userId).select(
        "-password -resetPasswordToken -resetPasswordTokenExpire"
      );
      if (!staff) return responseHelper.notFound(res, "Staff member not found");
      if (!staff.isActive)
        return responseHelper.unauthorized(res, "Account is deactivated");
      req.user = staff;
    } else {
      const user = await UserModel.findById(userId).select(
        "-password -resetPasswordToken -resetPasswordTokenExpire"
      );
      if (!user) return responseHelper.notFound(res, "User not found");
      req.user = user;
    }

    next();
  } catch (err) {
    return responseHelper.unauthorized(res, "Invalid or expired token");
  }
};

// Alias for backward compatibility
export const authMiddleware = authGuard;

export default authGuard;
