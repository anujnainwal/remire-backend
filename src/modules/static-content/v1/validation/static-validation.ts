// validators/staticContent.create.ts
import { z } from "zod";

export const StaticCreateSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(200),
  shortDescription: z
    .string()
    .max(500)
    .optional()
    .or(z.literal("")),
  effectiveDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "effectiveDate must be YYYY-MM-DD"),
  content: z.string().min(1, "Content is required"),
  status: z.enum(["active", "inactive"]).optional().default("active"),
  isPublished: z.boolean().optional().default(false),
  type: z.enum(["about", "term-and-condition", "privacy-policy"]),
  // Do NOT accept slug from client by default (we auto-generate server-side).
  // If you want to allow admin override, add: slug: z.string().optional()
});

export type StaticCreateInput = z.infer<typeof StaticCreateSchema>;

export const StaticUpdateSchema = z
  .object({
    title: z.string().min(3).max(200).optional(),
    shortDescription: z.string().max(500).optional().or(z.literal("")).optional(),
    effectiveDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "effectiveDate must be YYYY-MM-DD")
      .optional(),
    content: z.string().min(1).optional(),
    status: z.enum(["active", "inactive"]).optional(),
    isPublished: z.boolean().optional(),
    type: z.enum(["about", "term-and-condition", "privacy-policy"]).optional(),
    // Be careful with slug updates. Omit it to keep server-generated slug,
    // or allow optional string if you explicitly want to permit override:
    // slug: z.string().min(1).optional()
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

export type StaticUpdateInput = z.infer<typeof StaticUpdateSchema>;