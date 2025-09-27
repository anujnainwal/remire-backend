import dotenv from "dotenv";
dotenv.config();
import jwt, { SignOptions } from "jsonwebtoken";

export interface JwtPayload {
  userId: string | null | any;
  email?: string;
  role?: string;
  type?: string;
}

interface TokenOptions {
  expiresIn?: string | number;
}

// Load secrets from env
const ACCESS_SECRET = process.env.JWT_SECRET!;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
const ACCESS_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "15m";
const REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

// Generate Access Token
export const generateAccessToken = (
  payload: JwtPayload,
  options?: TokenOptions
): string => {
  const signOptions: SignOptions = {
    expiresIn: options?.expiresIn ?? (ACCESS_EXPIRES_IN as any),
  };
  return jwt.sign(payload, ACCESS_SECRET, signOptions);
};

// Generate Refresh Token
export const generateRefreshToken = (
  payload: JwtPayload,
  options?: TokenOptions
): string => {
  const signOptions: SignOptions = {
    expiresIn: options?.expiresIn ?? (REFRESH_EXPIRES_IN as any),
  };
  return jwt.sign(payload, REFRESH_SECRET, signOptions);
};
