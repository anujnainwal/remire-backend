import mongoose, { Schema, Document, Model } from "mongoose";

export interface IEducationLoan extends Document {
  user: mongoose.Types.ObjectId;
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
  status: "pending" | "processing" | "approved" | "rejected" | "cancelled";
  assignedAgent?: string;
  notes?: string;
  documents?: {
    offerLetter?: string;
    passport?: string;
    academicTranscripts?: string;
    financialDocuments?: string;
    other?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const educationLoanSchema: Schema<IEducationLoan> = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    email: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    mobileNumber: { type: String, required: true },
    studyCountry: { type: String, required: true },
    instituteName: { type: String, required: true },
    courseDetails: { type: String, required: true },
    parentName: { type: String, required: true },
    parentMobileNumber: { type: String, required: true },
    loanAmount: { type: Number, default: null },
    loanPurpose: { type: String, default: null },
    status: {
      type: String,
      enum: ["pending", "processing", "approved", "rejected", "cancelled"],
      default: "pending",
    },
    assignedAgent: { type: String, default: null },
    notes: { type: String, default: null },
    documents: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

const EducationLoanModel: Model<IEducationLoan> =
  mongoose.model<IEducationLoan>("EducationLoan", educationLoanSchema);

export default EducationLoanModel;

