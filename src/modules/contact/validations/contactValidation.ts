import { z } from "zod";

export const contactMessageSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters")
    .regex(/^[a-zA-Z\s]+$/, "Name can only contain letters and spaces"),

  email: z
    .string()
    .trim()
    .email("Please provide a valid email address")
    .max(255, "Email cannot exceed 255 characters")
    .toLowerCase(),

  subject: z
    .string()
    .trim()
    .min(5, "Subject must be at least 5 characters")
    .max(200, "Subject cannot exceed 200 characters"),

  message: z
    .string()
    .trim()
    .min(10, "Message must be at least 10 characters")
    .max(2000, "Message cannot exceed 2000 characters"),
});

export const updateContactStatusSchema = z.object({
  status: z
    .enum(["new", "read", "replied", "archived"])
    .optional(),

  priority: z
    .enum(["low", "medium", "high"])
    .optional(),

  adminNotes: z
    .string()
    .trim()
    .max(500, "Admin notes cannot exceed 500 characters")
    .optional(),
});
