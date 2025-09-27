import mongoose, { Schema, Document, Model } from "mongoose";
import bcrypt from "bcrypt";

export type StaffRole =
  | "super-admin"
  | "admin"
  | "manager"
  | "agent"
  | "support";

export interface IStaff extends Document {
  firstname: string;
  lastname: string;
  email: string;
  password: string;
  role: StaffRole;
  permissions: mongoose.Types.ObjectId[];
  isActive: boolean;
  lastLogin?: Date;
  phoneNumber?: string;
  department?: string;
  employeeId?: string;
  profilePicture?: string;
  resetPasswordToken?: string;
  resetPasswordTokenExpire?: Date;
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;

  // Methods
  comparePassword(password: string): Promise<boolean>;
  hasPermission(permission: string): Promise<boolean>;
  getFullName(): string;
}

const staffSchema: Schema<IStaff> = new Schema(
  {
    firstname: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    lastname: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    role: {
      type: String,
      enum: ["super-admin", "admin", "manager", "agent", "support"],
      required: true,
      default: "agent",
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
    lastLogin: {
      type: Date,
      default: null,
    },
    phoneNumber: {
      type: String,
      trim: true,
      match: [/^\+?[\d\s-()]+$/, "Please enter a valid phone number"],
    },
    department: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    employeeId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      uppercase: true,
    },
    profilePicture: {
      type: String,
      default: null,
    },
    resetPasswordToken: String,
    resetPasswordTokenExpire: Date,
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
    collection: "staff",
  }
);

// Optimized indexes for better performance
staffSchema.index({ role: 1, isActive: 1 }); // Compound index for role filtering
staffSchema.index({ isActive: 1, createdAt: -1 }); // Compound index for active staff sorted by creation
staffSchema.index({ email: 1 }); // Unique index already exists
staffSchema.index({ employeeId: 1 }); // Unique index already exists
staffSchema.index({ createdBy: 1 }); // Index for createdBy queries
staffSchema.index({ lastLogin: -1 }); // Index for last login sorting

// Pre-save middleware to hash password
staffSchema.pre<IStaff>("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Instance methods
staffSchema.methods.comparePassword = async function (
  password: string
): Promise<boolean> {
  return bcrypt.compare(password, this.password);
};

staffSchema.methods.hasPermission = async function (
  permission: string
): Promise<boolean> {
  // Super admin has all permissions
  if (this.role === "super-admin") return true;

  // Check if staff has the specific permission
  const Permission = mongoose.model("Permission");
  const staffPermissions = await Permission.find({
    _id: { $in: this.permissions },
  });
  return staffPermissions.some((p) => p.name === permission);
};

staffSchema.methods.getFullName = function (): string {
  return `${this.firstname} ${this.lastname}`;
};

// Virtual for full name
staffSchema.virtual("fullName").get(function () {
  return `${this.firstname} ${this.lastname}`;
});

// Ensure virtual fields are serialized
staffSchema.set("toJSON", { virtuals: true });
staffSchema.set("toObject", { virtuals: true });

const StaffModel: Model<IStaff> = mongoose.model<IStaff>("Staff", staffSchema);
export default StaffModel;
