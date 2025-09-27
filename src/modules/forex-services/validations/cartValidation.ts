import * as z from "zod";

// Cart item validation schema
const cartItemSchema = z.object({
  serviceType: z.enum([
    "send-money",
    "nri-repatriation",
    "german-blocked-account",
    "gic-payment",
    "create-gic-account",
    "education-loan",
  ]),
  quantity: z.number().positive("Quantity must be positive").default(1),
  unitPrice: z.number().positive("Unit price must be positive"),
  totalPrice: z.number().positive("Total price must be positive"),
  currency: z.string().min(1, "Currency is required"),
  metadata: z.record(z.string(), z.any()),
  isActive: z.boolean().default(true),
  expiresAt: z.string().optional(),
});

// Send Money metadata validation
const sendMoneyMetadataSchema = z.object({
  fromState: z.number().min(1, "State is required"),
  fromCity: z.number().min(1, "City is required"),
  transferTo: z.string().min(1, "Transfer destination is required"),
  purpose: z.string().min(1, "Purpose is required"),
  currency: z.string().min(1, "Currency is required"),
  amount: z.number().positive("Amount must be positive"),
  total: z.number().positive("Total must be positive"),
  exchangeRate: z.number().positive("Exchange rate must be positive"),
});

// NRI Repatriation metadata validation
const nriRepatriationMetadataSchema = z.object({
  fromState: z.number().min(1, "State is required"),
  fromCity: z.number().min(1, "City is required"),
  transferTo: z.string().min(1, "Transfer destination is required"),
  purpose: z.string().min(1, "Purpose is required"),
  currency: z.string().min(1, "Currency is required"),
  amount: z.number().positive("Amount must be positive"),
  total: z.number().positive("Total must be positive"),
  exchangeRate: z.number().positive("Exchange rate must be positive"),
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

// German Blocked Account metadata validation
const germanBlockedAccountMetadataSchema = z.object({
  fromState: z.number().min(1, "State is required"),
  fromCity: z.number().min(1, "City is required"),
  transferTo: z.string().min(1, "Transfer destination is required"),
  purpose: z.string().min(1, "Purpose is required"),
  currency: z.string().min(1, "Currency is required"),
  amount: z.number().positive("Amount must be positive"),
  total: z.number().positive("Total must be positive"),
  exchangeRate: z.number().positive("Exchange rate must be positive"),
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

// GIC Payment metadata validation
const gicPaymentMetadataSchema = z.object({
  fromCountry: z.number().min(1, "Country is required"),
  fromState: z.number().min(1, "State is required"),
  fromCity: z.number().min(1, "City is required"),
  transferTo: z.string().min(1, "Transfer destination is required"),
  purpose: z.string().min(1, "Purpose is required"),
  currency: z.string().min(1, "Currency is required"),
  amount: z.number().positive("Amount must be positive"),
  total: z.number().positive("Total must be positive"),
  exchangeRate: z.number().positive("Exchange rate must be positive"),
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

// Create GIC Account metadata validation
const createGicAccountMetadataSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  mobileNumber: z.string().min(10, "Mobile number must be at least 10 digits"),
  countryCode: z.string().min(1, "Country code is required"),
  email: z.string().email("Invalid email address"),
  blockedAccountPreference: z
    .string()
    .min(1, "Blocked account preference is required"),
  offerLetter: z.string().optional(),
  passportCopy: z.string().optional(),
});

// Education Loan metadata validation
const educationLoanMetadataSchema = z.object({
  email: z.string().email("Invalid email address"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  mobileNumber: z.string().min(10, "Mobile number must be at least 10 digits"),
  studyCountry: z.string().min(1, "Study country is required"),
  instituteName: z.string().min(1, "Institute name is required"),
  courseDetails: z.string().min(1, "Course details are required"),
  parentName: z.string().min(1, "Parent name is required"),
  parentMobileNumber: z
    .string()
    .min(10, "Parent mobile number must be at least 10 digits"),
  loanAmount: z.number().positive("Loan amount must be positive").optional(),
  loanPurpose: z.string().optional(),
  documents: z
    .object({
      offerLetter: z.string().optional(),
      passport: z.string().optional(),
      academicTranscripts: z.string().optional(),
      financialDocuments: z.string().optional(),
      other: z.array(z.string()).optional(),
    })
    .optional(),
});

// Dynamic cart item validation based on service type
export const createCartItemSchema = z
  .object({
    serviceType: z.enum([
      "send-money",
      "nri-repatriation",
      "german-blocked-account",
      "gic-payment",
      "create-gic-account",
      "education-loan",
    ]),
    quantity: z.number().positive("Quantity must be positive").default(1),
    unitPrice: z.number().positive("Unit price must be positive"),
    totalPrice: z.number().positive("Total price must be positive"),
    currency: z.string().min(1, "Currency is required"),
    metadata: z.record(z.string(), z.any()),
    isActive: z.boolean().default(true),
    expiresAt: z.string().optional(),
  })
  .refine(
    (data) => {
      // Validate metadata based on service type
      switch (data.serviceType) {
        case "send-money":
          return sendMoneyMetadataSchema.safeParse(data.metadata).success;
        case "nri-repatriation":
          return nriRepatriationMetadataSchema.safeParse(data.metadata).success;
        case "german-blocked-account":
          return germanBlockedAccountMetadataSchema.safeParse(data.metadata)
            .success;
        case "gic-payment":
          return gicPaymentMetadataSchema.safeParse(data.metadata).success;
        case "create-gic-account":
          return createGicAccountMetadataSchema.safeParse(data.metadata)
            .success;
        case "education-loan":
          return educationLoanMetadataSchema.safeParse(data.metadata).success;
        default:
          return false;
      }
    },
    {
      message: "Invalid metadata for the specified service type",
      path: ["metadata"],
    }
  );

export const updateCartItemSchema = z.object({
  quantity: z.number().positive("Quantity must be positive").optional(),
  unitPrice: z.number().positive("Unit price must be positive").optional(),
  totalPrice: z.number().positive("Total price must be positive").optional(),
  currency: z.string().min(1, "Currency is required").optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  isActive: z.boolean().optional(),
  expiresAt: z.string().optional(),
});

export const updateCartSchema = z.object({
  discountCode: z.string().optional(),
  discountAmount: z
    .number()
    .min(0, "Discount amount cannot be negative")
    .optional(),
  taxAmount: z.number().min(0, "Tax amount cannot be negative").optional(),
  status: z.enum(["active", "abandoned", "converted", "expired"]).optional(),
  expiresAt: z.string().optional(),
});

export default createCartItemSchema;
