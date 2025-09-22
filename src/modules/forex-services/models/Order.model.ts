import mongoose, { Schema, Document, Model } from "mongoose";

export interface IOrderMetadata {
  // Send Money specific metadata
  sendMoney?: {
    fromState: number;
    fromCity: number;
    transferTo: string;
    purpose: string;
    currency: string;
    amount: number;
    total: number;
    exchangeRate: number;
  };

  // NRI Repatriation specific metadata
  nriRepatriation?: {
    fromState: number;
    fromCity: number;
    transferTo: string;
    purpose: string;
    currency: string;
    amount: number;
    total: number;
    exchangeRate: number;
    nriDetails?: {
      passportNumber?: string;
      visaType?: string;
      countryOfResidence?: string;
      bankAccountNumber?: string;
      ifscCode?: string;
    };
    complianceDocuments?: {
      passport?: string;
      visa?: string;
      bankStatement?: string;
      taxReturn?: string;
      other?: string[];
    };
  };

  // German Blocked Account specific metadata
  germanBlockedAccount?: {
    fromState: number;
    fromCity: number;
    transferTo: string;
    purpose: string;
    currency: string;
    amount: number;
    total: number;
    exchangeRate: number;
    germanDetails?: {
      universityName?: string;
      courseOfStudy?: string;
      semester?: string;
      expectedDuration?: string;
      passportNumber?: string;
      visaType?: string;
      bankAccountNumber?: string;
      ifscCode?: string;
    };
    complianceDocuments?: {
      passport?: string;
      visa?: string;
      universityAdmissionLetter?: string;
      bankStatement?: string;
      other?: string[];
    };
  };

  // GIC Payment specific metadata
  gicPayment?: {
    fromCountry: number;
    fromState: number;
    fromCity: number;
    transferTo: string;
    purpose: string;
    currency: string;
    amount: number;
    total: number;
    exchangeRate: number;
    canadianDetails?: {
      universityName?: string;
      programOfStudy?: string;
      intake?: string;
      expectedDuration?: string;
      passportNumber?: string;
      visaType?: string;
      bankAccountNumber?: string;
      ifscCode?: string;
      gicProvider?: string;
    };
    complianceDocuments?: {
      passport?: string;
      visa?: string;
      universityAdmissionLetter?: string;
      bankStatement?: string;
      gicCertificate?: string;
      other?: string[];
    };
  };

  // Create GIC Account specific metadata
  createGicAccount?: {
    firstName: string;
    lastName: string;
    mobileNumber: string;
    countryCode: string;
    email: string;
    blockedAccountPreference: string;
    offerLetter?: string;
    passportCopy?: string;
  };

  // Education Loan specific metadata
  educationLoan?: {
    email: string;
    firstName: string;
    lastName: string;
    mobileNumber: string;
    studyCountry: string;
    instituteName: string;
    courseDetails: string;
    parentName: string;
    parentMobileNumber: string;
    loanAmount?: number;
    loanPurpose?: string;
    documents?: {
      offerLetter?: string;
      passport?: string;
      academicTranscripts?: string;
      financialDocuments?: string;
      other?: string[];
    };
  };
}

export interface IOrder extends Document {
  user: mongoose.Types.ObjectId;
  orderType:
    | "send-money"
    | "nri-repatriation"
    | "german-blocked-account"
    | "gic-payment"
    | "create-gic-account"
    | "education-loan";
  orderNumber: string;
  status:
    | "pending"
    | "processing"
    | "completed"
    | "cancelled"
    | "failed"
    | "refunded";
  paymentStatus:
    | "pending"
    | "processing"
    | "paid"
    | "failed"
    | "refunded"
    | "completed";
  kycStatus: "pending" | "approved" | "rejected";
  totalAmount: number;
  currency: string;
  metadata: IOrderMetadata;
  cart?: mongoose.Types.ObjectId;
  razorpayOrderId?: string;
  paymentId?: string;
  completedAt?: Date;
  failedAt?: Date;
  paymentDetails?: {
    paymentMethod?: string;
    transactionId?: string;
    paymentReference?: string;
    paymentDate?: Date;
    gatewayResponse?: any;
  };
  trackingDetails?: {
    currentStep: string;
    completedSteps: string[];
    estimatedCompletion?: Date;
    lastUpdated: Date;
  };
  assignedAgent?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const orderSchema: Schema<IOrder> = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    orderType: {
      type: String,
      enum: [
        "send-money",
        "nri-repatriation",
        "german-blocked-account",
        "gic-payment",
        "create-gic-account",
        "education-loan",
      ],
      required: true,
    },
    orderNumber: { type: String, required: true, unique: true },
    status: {
      type: String,
      enum: [
        "pending",
        "processing",
        "completed",
        "cancelled",
        "failed",
        "refunded",
      ],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: [
        "pending",
        "processing",
        "paid",
        "failed",
        "refunded",
        "completed",
      ],
      default: "pending",
    },
    kycStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    totalAmount: { type: Number, required: true },
    currency: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed, required: true },
    cart: { type: Schema.Types.ObjectId, ref: "Cart", default: null },
    razorpayOrderId: { type: String, default: null },
    paymentId: { type: String, default: null },
    completedAt: { type: Date, default: null },
    failedAt: { type: Date, default: null },
    paymentDetails: { type: Schema.Types.Mixed, default: {} },
    trackingDetails: { type: Schema.Types.Mixed, default: {} },
    assignedAgent: { type: String, default: null },
    notes: { type: String, default: null },
  },
  { timestamps: true }
);

// Generate order number before saving
orderSchema.pre("save", function (next) {
  if (!this.orderNumber) {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.orderNumber = `ORD-${timestamp}-${random}`;
  }
  next();
});

const OrderModel: Model<IOrder> = mongoose.model<IOrder>("Order", orderSchema);

export default OrderModel;
