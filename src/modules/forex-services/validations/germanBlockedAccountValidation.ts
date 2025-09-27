import * as z from "zod";

export const germanBlockedAccountSchema = z.object({
  fromState: z.number().min(1, "State is required"),
  fromCity: z.number().min(1, "City is required"),
  transferTo: z.string().min(1, "Please select a country."),
  purpose: z.string().min(1, "Please select a purpose."),
  currency: z.string().min(1, "Please select a currency."),
  amount: z.number().positive("Amount must be positive."),
  total: z.number().positive("Total amount must be positive."),
  germanDetails: z
    .object({
      universityName: z.string().optional(),
      courseOfStudy: z.string().optional(),
      semester: z.string().optional(),
      expectedDuration: z.string().optional(),
      passportNumber: z.string().optional(),
      visaType: z.string().optional(),
      bankAccountNumber: z.string().optional(),
      ifscCode: z.string().optional(),
    })
    .optional(),
  complianceDocuments: z
    .object({
      passport: z.string().optional(),
      visa: z.string().optional(),
      universityAdmissionLetter: z.string().optional(),
      bankStatement: z.string().optional(),
      other: z.array(z.string()).optional(),
    })
    .optional(),
});

export default germanBlockedAccountSchema;

