import { z } from "zod";

// Customer Creation Schema
export const createCustomerSchema = z.object({
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
  phoneNumber: z
    .string()
    .regex(/^\+?[\d\s-()]+$/, "Please enter a valid phone number")
    .optional(),
  country: z.string().max(100, "Country name is too long").optional(),
  address: z.string().max(200, "Address is too long").optional(),
  city: z.string().max(100, "City name is too long").optional(),
  state: z.string().max(100, "State name is too long").optional(),
  postalCode: z.string().max(20, "Postal code is too long").optional(),
  kycStatus: z
    .enum(["pending", "approved", "rejected", "not_required"])
    .default("not_required"),
});

// Customer Update Schema
export const updateCustomerSchema = z.object({
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
  phoneNumber: z
    .string()
    .regex(/^\+?[\d\s-()]+$/, "Please enter a valid phone number")
    .optional(),
  country: z.string().max(100, "Country name is too long").optional(),
  address: z.string().max(200, "Address is too long").optional(),
  city: z.string().max(100, "City name is too long").optional(),
  state: z.string().max(100, "State name is too long").optional(),
  postalCode: z.string().max(20, "Postal code is too long").optional(),
  isActive: z.boolean().optional(),
  isBlocked: z.boolean().optional(),
  blockedReason: z.string().max(500, "Blocked reason is too long").optional(),
  kycStatus: z
    .enum(["pending", "approved", "rejected", "not_required"])
    .optional(),
});

// Block Customer Schema
export const blockCustomerSchema = z.object({
  reason: z
    .string()
    .min(10, "Block reason must be at least 10 characters")
    .max(500, "Block reason is too long"),
});

// Customer Query Schema
export const customerQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default(1),
  limit: z.string().regex(/^\d+$/).transform(Number).default(10),
  search: z.string().optional(),
  status: z.enum(["active", "inactive", "blocked", "all"]).default("all"),
  kycStatus: z
    .enum(["pending", "approved", "rejected", "not_required", "all"])
    .default("all"),
  country: z.string().optional(),
});

// Customer Password Update Schema
export const updateCustomerPasswordSchema = z
  .object({
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

