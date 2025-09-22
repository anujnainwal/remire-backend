import * as z from "zod";

// Base order validation schema
const baseOrderSchema = z.object({
  orderType: z.enum([
    "send-money",
    "nri-repatriation",
    "german-blocked-account",
    "gic-payment",
    "create-gic-account",
    "education-loan",
  ]),
  totalAmount: z.number().positive("Total amount must be positive"),
  currency: z.string().min(1, "Currency is required"),
  metadata: z.record(z.string(), z.any()),
  paymentDetails: z
    .object({
      paymentMethod: z.string().optional(),
      transactionId: z.string().optional(),
      paymentReference: z.string().optional(),
      paymentDate: z.string().optional(),
      gatewayResponse: z.any().optional(),
    })
    .optional(),
  trackingDetails: z
    .object({
      currentStep: z.string().optional(),
      completedSteps: z.array(z.string()).optional(),
      estimatedCompletion: z.string().optional(),
      lastUpdated: z.string().optional(),
    })
    .optional(),
  assignedAgent: z.string().optional(),
  notes: z.string().optional(),
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

// Dynamic order validation based on order type
export const createOrderSchema = z
  .object({
    orderType: z.enum([
      "send-money",
      "nri-repatriation",
      "german-blocked-account",
      "gic-payment",
      "create-gic-account",
      "education-loan",
    ]),
    totalAmount: z.number().positive("Total amount must be positive"),
    currency: z.string().min(1, "Currency is required"),
    metadata: z.record(z.string(), z.any()),
    paymentDetails: z
      .object({
        paymentMethod: z.string().optional(),
        transactionId: z.string().optional(),
        paymentReference: z.string().optional(),
        paymentDate: z.string().optional(),
        gatewayResponse: z.any().optional(),
      })
      .optional(),
    trackingDetails: z
      .object({
        currentStep: z.string().optional(),
        completedSteps: z.array(z.string()).optional(),
        estimatedCompletion: z.string().optional(),
        lastUpdated: z.string().optional(),
      })
      .optional(),
    assignedAgent: z.string().optional(),
    notes: z.string().optional(),
  })
  .refine(
    (data) => {
      // Validate metadata based on order type
      switch (data.orderType) {
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
      message: "Invalid metadata for the specified order type",
      path: ["metadata"],
    }
  );

export const updateOrderSchema = z.object({
  status: z
    .enum([
      "pending",
      "processing",
      "completed",
      "cancelled",
      "failed",
      "refunded",
    ])
    .optional(),
  paymentStatus: z
    .enum(["pending", "processing", "paid", "failed", "refunded"])
    .optional(),
  kycStatus: z.enum(["pending", "approved", "rejected"]).optional(),
  paymentDetails: z
    .object({
      paymentMethod: z.string().optional(),
      transactionId: z.string().optional(),
      paymentReference: z.string().optional(),
      paymentDate: z.string().optional(),
      gatewayResponse: z.any().optional(),
    })
    .optional(),
  trackingDetails: z
    .object({
      currentStep: z.string().optional(),
      completedSteps: z.array(z.string()).optional(),
      estimatedCompletion: z.string().optional(),
      lastUpdated: z.string().optional(),
    })
    .optional(),
  assignedAgent: z.string().optional(),
  notes: z.string().optional(),
});

export default createOrderSchema;
