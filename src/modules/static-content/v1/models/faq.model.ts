import mongoose, { Schema, Document } from "mongoose";

export interface IFaq extends Document {
    question: string;
    answer: string;
    category: string;
    status: "active" | "inactive";
    isPublished: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const FaqSchema: Schema = new Schema(
    {
        question: { type: String, required: true },
        answer: { type: String, required: true },
        category: { type: String, required: true },
        status: {
            type: String,
            enum: ["active", "inactive"],
            default: "active",
        },
        isPublished: { type: Boolean, default: false },
    },
    { timestamps: true }
);

export default mongoose.model<IFaq>("Faq", FaqSchema);
