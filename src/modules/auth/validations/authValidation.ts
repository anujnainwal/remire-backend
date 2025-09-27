import * as z from "zod";
// User register validation
export const registerSchema = z.object({
  firstname: z.string().min(2, "First name must be at least 2 characters"),
  lastname: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["user", "technician"]).optional(),
  deviceId: z.string().optional(),
  deviceType: z.enum(["ios", "android", "web"]).optional(),
  fcmToken: z.string().optional(),
  userAgent: z.string().optional(),
  timezone: z.string().optional(),
  ipAddress: z
    .string()
    .regex(
      /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^([a-fA-F0-9:]+:+)+[a-fA-F0-9]+$/,
      "Invalid IP address"
    )
    .optional(),
  acceptLegal: z.boolean()
});

// User login validation
export const loginSchema = z.object({
  email: z.string().email("Invalid email address").lowercase().trim(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  deviceId: z.string().uuid().optional(),
  deviceType: z.enum(["ios", "android", "web"]).optional(),
  fcmToken: z.string().optional(),
  userAgent: z.string().optional(),
  timezone: z.string().optional(),
  ipAddress: z
    .string()
    .regex(
      /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^([a-fA-F0-9:]+:+)+[a-fA-F0-9]+$/,
      "Invalid IP address"
    )
    .optional(),
});

// Forgot password validation
export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

// Reset password validation
export const resetPasswordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
  token: z.string(),
});
