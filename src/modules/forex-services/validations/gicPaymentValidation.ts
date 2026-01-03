import * as z from "zod";

export const gicPaymentSchema = z.object({
  fromCountry: z.number().min(1, "Country is required"),
  fromState: z.number().min(1, "State is required"),
  fromCity: z.number().min(1, "City is required"),
  transferTo: z.string().min(1, "Please select a country."),
  purpose: z.string().min(1, "Please select a purpose."),
  currency: z.string().min(1, "Please select a currency."),
  amount: z.number().positive("Amount must be positive."),
  total: z.number().positive("Total amount must be positive."),
  canadianDetails: z
    .object({
      universityName: z.string().optional(),
      programOfStudy: z.string().optional(),
      intake: z.string().optional(),
      expectedDuration: z.string().optional(),
      passportNumber: z.string().optional(),
      visaType: z.string().optional(),
      bankAccountNumber: z.string().optional(),
      ifscCode: z.string().optional(),
      gicProvider: z.string().optional(),
    })
    .optional(),
  complianceDocuments: z
    .object({
      passport: z.string().optional(),
      visa: z.string().optional(),
      universityAdmissionLetter: z.string().optional(),
      bankStatement: z.string().optional(),
      gicCertificate: z.string().optional(),
      other: z.array(z.string()).optional(),
    })
    .optional(),
});

export default gicPaymentSchema;

