import mongoose, { Schema, Document } from "mongoose";
import { generateSlug } from "../../../../utils/slugify.util";

export interface IStaticContent extends Document {
  title: string;
  slug: string;
  shortDescription: string;
  effectiveDate: string;
  content: string;
  status: "active" | "inactive";
  isPublished: boolean;
  type: "about" | "term-and-condition" | "privacy-policy";
}



const staticSchema = new Schema<IStaticContent>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, trim: true, lowercase: true },
    shortDescription: { type: String, default: "" },
    effectiveDate: { type: String, required: true },
    content: { type: String, required: true },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    isPublished: { type: Boolean, default: false },
    type: {
      type: String,
      enum: ["about", "term-and-condition", "privacy-policy"],
      required: true,
    },
  },
  { timestamps: true }
);


staticSchema.pre("save", function (next) {
  if (this.isModified("title")) {
    this.slug = generateSlug(this.title);
  }
  next();
});

const StaticContentModel =mongoose.model<IStaticContent>("StaticContent", staticSchema);
export default StaticContentModel