import * as z from "zod";

export const nriRepatriationValidationSchema = z.object({
  fromState: z.number().min(1, "State is required"),
  fromCity: z.number().min(1, "City is required"),
  transferTo: z.string().min(1, "Please select a country."),
  purpose: z.string().min(1, "Please select a purpose."),
  currency: z.string().min(1, "Please select a currency."),
  amount: z.number().positive("Amount must be positive."),
  total: z.number().positive("Total must be positive."),
  nriDetails: z
    .object({
      passportNumber: z.string().optional(),
      visaType: z.string().optional(),
      countryOfResidence: z.string().optional(),
      bankAccountNumber: z.string().optional(),
      ifscCode: z.string().optional(),
    })
    .optional(),
  complianceDocuments: z
    .object({
      passport: z.string().optional(),
      visa: z.string().optional(),
      bankStatement: z.string().optional(),
      taxReturn: z.string().optional(),
      other: z.array(z.string()).optional(),
    })
    .optional(),
});

export default nriRepatriationValidationSchema;

