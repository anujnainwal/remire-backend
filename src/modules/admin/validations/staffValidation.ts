import { z } from "zod";

// Staff Login Schema
export const staffLoginSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid email address")
    .min(1, "Email is required"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(100, "Password is too long"),
});

// Staff Registration Schema
export const staffRegisterSchema = z.object({
  firstname: z
    .string()
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name is too long")
    .trim(),
  lastname: z
    .string()
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name is too long")
    .trim(),
  email: z
    .string()
    .email("Please enter a valid email address")
    .min(1, "Email is required"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(100, "Password is too long"),
  role: z
    .enum(["super-admin", "admin", "manager", "agent", "support"])
    .optional()
    .default("agent"),
  phoneNumber: z
    .string()
    .regex(/^\+?[\d\s-()]+$/, "Please enter a valid phone number")
    .optional(),
  department: z.string().max(100, "Department name is too long").optional(),
  employeeId: z.string().max(20, "Employee ID is too long").optional(),
});

// Staff Update Schema
export const staffUpdateSchema = z.object({
  firstname: z
    .string()
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name is too long")
    .trim()
    .optional(),
  lastname: z
    .string()
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name is too long")
    .trim()
    .optional(),
  email: z.string().email("Please enter a valid email address").optional(),
  role: z
    .enum(["super-admin", "admin", "manager", "agent", "support"])
    .optional(),
  phoneNumber: z
    .string()
    .regex(/^\+?[\d\s-()]+$/, "Please enter a valid phone number")
    .optional(),
  department: z.string().max(100, "Department name is too long").optional(),
  employeeId: z.string().max(20, "Employee ID is too long").optional(),
  isActive: z.boolean().optional(),
});

// Permission Schema
export const permissionSchema = z.object({
  name: z
    .string()
    .min(3, "Permission name must be at least 3 characters")
    .max(50, "Permission name is too long")
    .regex(
      /^[a-z-]+$/,
      "Permission name must contain only lowercase letters and hyphens"
    )
    .trim(),
  module: z.enum([
    "dashboard",
    "users",
    "orders",
    "payments",
    "forex-services",
    "reports",
    "settings",
    "staff-management",
    "notifications",
    "analytics",
  ]),
  action: z.enum([
    "create",
    "read",
    "update",
    "delete",
    "export",
    "import",
    "approve",
    "reject",
    "manage",
  ]),
});

// Role Schema
export const roleSchema = z.object({
  name: z
    .string()
    .min(2, "Role name must be at least 2 characters")
    .max(50, "Role name is too long")
    .trim(),
  permissions: z
    .array(z.string())
    .min(1, "At least one permission is required"),
  level: z
    .number()
    .min(1, "Level must be at least 1")
    .max(100, "Level cannot exceed 100")
    .optional()
    .default(1),
});

// Assign Permissions Schema
export const assignPermissionsSchema = z.object({
  staffId: z.string().min(1, "Staff ID is required"),
  permissions: z
    .array(z.string())
    .min(1, "At least one permission is required"),
});

// Change Password Schema
export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(6, "Current password must be at least 6 characters"),
    newPassword: z
      .string()
      .min(6, "New password must be at least 6 characters")
      .max(100, "New password is too long"),
    confirmPassword: z
      .string()
      .min(6, "Confirm password must be at least 6 characters"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

// Forgot Password Schema
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid email address")
    .min(1, "Email is required"),
});

// Reset Password Schema
export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Reset token is required"),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .max(100, "Password is too long"),
    confirmPassword: z
      .string()
      .min(6, "Confirm password must be at least 6 characters"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

// Module-based Permission Schema
export const modulePermissionSchema = z.object({
  create: z.boolean().default(false),
  read: z.boolean().default(false),
  update: z.boolean().default(false),
  delete: z.boolean().default(false),
});

// Role Creation with Module Permissions Schema
export const roleWithPermissionsSchema = z.object({
  name: z
    .string()
    .min(2, "Role name must be at least 2 characters")
    .max(50, "Role name is too long")
    .trim(),
  level: z
    .number()
    .int("Level must be an integer")
    .min(1, "Level must be at least 1")
    .max(100, "Level cannot exceed 100"),
  permissions: z.record(z.string(), modulePermissionSchema),
  isActive: z.boolean().default(true),
});

// Role Update Schema
export const roleUpdateSchema = z.object({
  name: z
    .string()
    .min(2, "Role name must be at least 2 characters")
    .max(50, "Role name is too long")
    .trim()
    .optional(),
  level: z
    .number()
    .int("Level must be an integer")
    .min(1, "Level must be at least 1")
    .max(100, "Level cannot exceed 100")
    .optional(),
  permissions: z.record(z.string(), modulePermissionSchema).optional(),
  isActive: z.boolean().optional(),
});

// Assign Role to Staff Schema
export const assignRoleSchema = z.object({
  roleId: z.string().min(1, "Role ID is required"),
});

// User Access List Query Schema
export const userAccessListQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default(1),
  limit: z.string().regex(/^\d+$/).transform(Number).default(10),
  search: z.string().optional(),
  role: z
    .enum(["super-admin", "admin", "manager", "agent", "support"])
    .optional(),
});
