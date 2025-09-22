import mongoose, { Schema, Document, Model } from "mongoose";

export interface IGermanBlockedAccount extends Document {
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
  createdAt: Date;
  updatedAt: Date;
}

const germanBlockedAccountSchema: Schema<IGermanBlockedAccount> = new Schema(
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
    germanDetails: { type: Schema.Types.Mixed, default: {} },
    complianceDocuments: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

const GermanBlockedAccountModel: Model<IGermanBlockedAccount> =
  mongoose.model<IGermanBlockedAccount>(
    "GermanBlockedAccount",
    germanBlockedAccountSchema
  );

export default GermanBlockedAccountModel;

