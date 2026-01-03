import * as z from "zod";

export const orderItemSchema = z.object({
  id: z.string().optional(),
  currencyYouWant: z.string().min(1, "Currency is required"),
  productType: z.string().min(1, "Product type is required"),
  amount: z.number().positive("Amount must be positive"),
  equivalentAmount: z.number().positive("Equivalent amount is required"),
  exchangeRate: z.number().positive("Exchange rate must be positive"),
});

export const travelDetailsSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  email: z.string().email("Invalid email address"),
  mobileNumber: z.string().min(6, "Invalid mobile number"),
});

export const addressSchema = z.object({
  addressLine1: z.string().min(1, "Address line 1 is required"),
  addressLine2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  pincode: z.string().min(3, "Invalid pincode"),
  country: z.string().min(1, "Country is required"),
});

export const documentSchema = z.object({
  id: z.string().optional(),
  type: z.enum(["pan", "visa", "ticket"]),
  name: z.string().min(1),
});

const forexCurrencyValidationSchema = z.object({
  location: z.string().min(1),
  currencyYouHave: z.string().min(1),
  currencyYouWant: z.string().min(1),
  productType: z.string().min(1),
  amount: z.number().positive(),
  equivalentAmount: z.number().positive(),
  transactionType: z.enum(["buy", "sell"]),
  orderItems: z.array(orderItemSchema).min(1, "Add at least one currency item"),
  travelDetails: travelDetailsSchema,
  deliveryAddress: addressSchema,
  documents: z.array(documentSchema).min(1, "Upload required documents"),
});

export default forexCurrencyValidationSchema;


