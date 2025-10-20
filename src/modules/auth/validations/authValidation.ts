import * as z from "zod";

// Normalize and validate deviceType from diverse mobile clients
const allowedDeviceTypes = [
  "web",
  "mobile",
  "tablet",
  "desktop",
  "ios",
  "android",
  "local",
] as const;

const deviceTypeSchema = z
  .string()
  .transform((v) => (v || "").toLowerCase().trim())
  .transform((v) => {
    const aliasMap: Record<string, string> = {
      iphone: "ios",
      ipad: "ios",
      ios: "ios",
      android: "android",
      phone: "mobile",
      smartphone: "mobile",
      mobile: "mobile",
      tablet: "tablet",
      desktop: "desktop",
      browser: "web",
      web: "web",
      local: "local",
    };
    return aliasMap[v] || v;
  })
  .refine((v) => (allowedDeviceTypes as readonly string[]).includes(v), {
    message: "Invalid deviceType",
  })
  .optional();
// User register validation
export const registerSchema = z.object({
  firstname: z.string().min(2, "First name must be at least 2 characters"),
  lastname: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["user", "technician"]).optional(),
  deviceId: z.string().optional(),
  deviceType: deviceTypeSchema,
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
  deviceType: deviceTypeSchema,
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
