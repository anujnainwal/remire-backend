import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISendMoney extends Document {
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
  createdAt: Date;
  updatedAt: Date;
}

const sendMoneySchema: Schema<ISendMoney> = new Schema(
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
  },
  { timestamps: true }
);

const SendMoneyModel: Model<ISendMoney> = mongoose.model<ISendMoney>(
  "SendMoney",
  sendMoneySchema
);
export default SendMoneyModel;
