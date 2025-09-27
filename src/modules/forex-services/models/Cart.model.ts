import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICartItemMetadata {
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

export interface ICartItem extends Document {
  serviceType:
    | "send-money"
    | "nri-repatriation"
    | "german-blocked-account"
    | "gic-payment"
    | "create-gic-account"
    | "education-loan";
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  currency: string;
  metadata: ICartItemMetadata;
  isActive: boolean;
  expiresAt?: Date;
}

export interface ICart extends Document {
  user: mongoose.Types.ObjectId;
  items: ICartItem[];
  subtotal: number;
  totalAmount: number;
  currency: string;
  discountCode?: string;
  discountAmount: number;
  taxAmount: number;
  status: "active" | "abandoned" | "converted" | "expired" | "completed";
  expiresAt?: Date;
  lastAccessedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const cartItemSchema: Schema<ICartItem> = new Schema(
  {
    serviceType: {
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
    quantity: { type: Number, required: true, default: 1 },
    unitPrice: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    currency: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed, required: true },
    isActive: { type: Boolean, default: true },
    expiresAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const cartSchema: Schema<ICart> = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    items: [cartItemSchema],
    subtotal: { type: Number, required: true, default: 0 },
    totalAmount: { type: Number, required: true, default: 0 },
    currency: { type: String, required: true, default: "INR" },
    discountCode: { type: String, default: null },
    discountAmount: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["active", "abandoned", "converted", "expired", "completed"],
      default: "active",
    },
    expiresAt: { type: Date, default: null },
    lastAccessedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Calculate totals before saving
cartSchema.pre("save", function (next) {
  this.subtotal = this.items.reduce((sum, item) => sum + item.totalPrice, 0);
  this.totalAmount = this.subtotal + this.taxAmount - this.discountAmount;
  this.lastAccessedAt = new Date();
  next();
});

const CartModel: Model<ICart> = mongoose.model<ICart>("Cart", cartSchema);

export default CartModel;
