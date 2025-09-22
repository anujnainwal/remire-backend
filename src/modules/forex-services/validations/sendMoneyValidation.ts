import * as z from "zod";

export const sendMoneyValidationSchema = z.object({
  fromState: z.number().min(1, "State is required"),
  fromCity: z.number().min(1, "City is required"),
  transferTo: z.string().min(1, "Please select a country."),
  purpose: z.string().min(1, "Please select a purpose."),
  currency: z.string().min(1, "Please select a currency."),
  amount: z.number().positive("Amount must be positive."),
  total: z.number().positive("Total must be positive."),
});

export default sendMoneyValidationSchema;

