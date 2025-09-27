import mongoose, { Schema, Document, Model } from "mongoose";

export interface INriRepatriation extends Document {
  user: mongoose.Types.ObjectId;
  fromState: number;
  fromCity: number;
  transferTo: string;
  purpose: string;
  currency: string;
  amount: number;
  total: number;
  exchangeRate: number;
  status: "pending" | "processing" | "completed" | "cancelled" | "failed";
  transactionId?: string;
  paymentReference?: string;
  kycStatus: "pending" | "approved" | "rejected";
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
  createdAt: Date;
  updatedAt: Date;
}

const nriRepatriationSchema: Schema<INriRepatriation> = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    fromState: { type: Number, required: true },
    fromCity: { type: Number, required: true },
    transferTo: { type: String, required: true },
    purpose: { type: String, required: true },
    currency: { type: String, required: true },
    amount: { type: Number, required: true },
    total: { type: Number, required: true },
    exchangeRate: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "cancelled", "failed"],
      default: "pending",
    },
    transactionId: { type: String, default: null },
    paymentReference: { type: String, default: null },
    kycStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    nriDetails: {
      passportNumber: { type: String, default: null },
      visaType: { type: String, default: null },
      countryOfResidence: { type: String, default: null },
      bankAccountNumber: { type: String, default: null },
      ifscCode: { type: String, default: null },
    },
    complianceDocuments: {
      passport: { type: String, default: null },
      visa: { type: String, default: null },
      bankStatement: { type: String, default: null },
      taxReturn: { type: String, default: null },
      other: { type: [String], default: [] },
    },
  },
  { timestamps: true }
);

const NriRepatriationModel: Model<INriRepatriation> =
  mongoose.model<INriRepatriation>("NriRepatriation", nriRepatriationSchema);
export default NriRepatriationModel;
