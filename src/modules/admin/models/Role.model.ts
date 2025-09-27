import mongoose, { Schema, Document, Model } from "mongoose";

export interface IRole extends Document {
  name: string;
  permissions: mongoose.Types.ObjectId[];
  isActive: boolean;
  isSystemRole: boolean; // System roles cannot be deleted
  level: number; // Higher level means more privileges
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
}

const roleSchema: Schema<IRole> = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 50,
    },
    permissions: [
      {
        type: Schema.Types.ObjectId,
        ref: "Permission",
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    isSystemRole: {
      type: Boolean,
      default: false,
    },
    level: {
      type: Number,
      required: true,
      min: 1,
      max: 100,
      default: 1,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "Staff",
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "Staff",
    },
  },
  {
    timestamps: true,
    collection: "roles",
  }
);

// Indexes for better performance
roleSchema.index({ isActive: 1, level: -1 }); // Compound index for active roles sorted by level
roleSchema.index({ isSystemRole: 1, isActive: 1 }); // Compound index for system roles
roleSchema.index({ name: 1 }); // Unique index already exists, but adding for clarity
roleSchema.index({ createdBy: 1 }); // Index for createdBy queries

const RoleModel: Model<IRole> = mongoose.model<IRole>("Role", roleSchema);
export default RoleModel;
