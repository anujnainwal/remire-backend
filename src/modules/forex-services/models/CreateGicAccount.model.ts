import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICreateGicAccount extends Document {
  user: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  mobileNumber: string;
  countryCode: string;
  email: string;
  blockedAccountPreference: string;
  offerLetter?: string[];
  passportCopy?: string[];
  status: "pending" | "processing" | "completed" | "cancelled" | "failed";
  assignedAgent?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const createGicAccountSchema: Schema<ICreateGicAccount> = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    mobileNumber: { type: String, required: true },
    countryCode: { type: String, required: true, default: "+91" },
    email: { type: String, required: true },
    blockedAccountPreference: { type: String, required: true },
    offerLetter: [{
      originalName: {type: String, required: true},
      fileName: { type: String, required: true },
      filePath: { type: String, required: true },
      fileType: { type: String, required: true },
      fileSize: { type: Number, required: true },
      fileExtension: { type: String, required: true },
      fileCreatedAt: { type: Date, required: true },
      fileUpdatedAt: { type: Date, required: true },
    }],
    passportCopy: [{
      originalName: {type: String, required: true},
      fileName: { type: String, required: true },
      filePath: { type: String, required: true },
      fileType: { type: String, required: true },
      fileSize: { type: Number, required: true },
      fileExtension: { type: String, required: true },
      fileCreatedAt: { type: Date, required: true },
      fileUpdatedAt: { type: Date, required: true },
    }],
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "cancelled", "failed"],
      default: "pending",
    },
    assignedAgent: { type: String, default: null },
    notes: { type: String, default: null },
  },
  { timestamps: true }
);

const CreateGicAccountModel: Model<ICreateGicAccount> =
  mongoose.model<ICreateGicAccount>("CreateGicAccount", createGicAccountSchema);

export default CreateGicAccountModel;

