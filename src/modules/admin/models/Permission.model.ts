import mongoose, { Schema, Document, Model } from "mongoose";

export type PermissionModule =
  | "dashboard"
  | "users"
  | "orders"
  | "payments"
  | "forex-services"
  | "reports"
  | "settings"
  | "staff-management"
  | "notifications"
  | "analytics";

export type PermissionAction =
  | "create"
  | "read"
  | "update"
  | "delete"
  | "export"
  | "import"
  | "approve"
  | "reject"
  | "manage";

export interface IPermission extends Document {
  name: string;
  module: PermissionModule;
  action: PermissionAction;
  description?: string;
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
}

const permissionSchema: Schema<IPermission> = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^[a-z-]+$/,
        "Permission name must contain only lowercase letters and hyphens",
      ],
    },
    module: {
      type: String,
      enum: [
        "dashboard",
        "users",
        "orders",
        "payments",
        "forex-services",
        "reports",
        "settings",
        "staff-management",
        "notifications",
        "analytics",
      ],
      required: true,
    },
    action: {
      type: String,
      enum: [
        "create",
        "read",
        "update",
        "delete",
        "export",
        "import",
        "approve",
        "reject",
        "manage",
      ],
      required: true,
    },
    description: {
      type: String,
      required: false,
      trim: true,
      maxlength: 200,
    },
    isActive: {
      type: Boolean,
      default: true,
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
    collection: "permissions",
  }
);

// Indexes
permissionSchema.index({ isActive: 1 });
permissionSchema.index({ name: 1 });

// Compound index for unique module-action combination
permissionSchema.index({ module: 1, action: 1 }, { unique: true });

const PermissionModel: Model<IPermission> = mongoose.model<IPermission>(
  "Permission",
  permissionSchema
);
export default PermissionModel;
