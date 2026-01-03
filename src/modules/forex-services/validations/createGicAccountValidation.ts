import * as z from "zod";

export const createGicAccountSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  mobileNumber: z.string().min(10, "Mobile number must be at least 10 digits"),
  countryCode: z.string().min(1, "Country code is required"),
  email: z.string().email("Invalid email address"),
  blockedAccountPreference: z
    .string()
    .min(1, "Please select a blocked account preference"),
  // Files are handled by multer, not in body validation
});

export default createGicAccountSchema;

