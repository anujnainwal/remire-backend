import mongoose, { Schema, Document, Model } from "mongoose";
import bcrypt from "bcrypt";

export type AuthProvider = "local" | "google" | "facebook" | "apple";

export interface IUser extends Document {
  firstname: string;
  lastname: string;
  email: string;
  countryCode?: string;
  phoneNumber?: string;
  phoneVerified?: boolean;
  password?: string;
  role: "customer";
  authProvider: AuthProvider;
  providerId?: string; // social login ID
  profilePicture?: string;
  isVerified: boolean;
  isActive: boolean; // Account status
  isBlocked: boolean; // Blocked status
  blockedReason?: string; // Reason for blocking
  blockedAt?: Date; // When account was blocked
  blockedBy?: mongoose.Types.ObjectId; // Who blocked the account
  lastLogin?: Date; // Last login date
  resetPasswordToken?: String;
  resetPasswordTokenExpire?: Date;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  location?: {
    type: "Point";
    coordinates: [number, number]; // [lng, lat]
  };
  timezone?: string;
  kycStatus: "pending" | "approved" | "rejected" | "not_required"; // KYC status
  kycDocuments?: string[]; // Array of document URLs
  acceptLegal: boolean;

  comparePassword(password: string): Promise<boolean>;
}

const userSchema: Schema<IUser> = new Schema(
  {
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    role: { type: String, enum: ["customer"], default: "customer" },
    authProvider: {
      type: String,
      enum: ["local", "google", "facebook", "apple"],
      default: "local",
    },
    providerId: { type: String, default: null },
    profilePicture: { type: String, default: null },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    isBlocked: { type: Boolean, default: false },
    blockedReason: { type: String, default: null },
    blockedAt: { type: Date, default: null },
    blockedBy: { type: Schema.Types.ObjectId, ref: "Staff", default: null },
    lastLogin: { type: Date, default: null },
    resetPasswordToken: String,
    resetPasswordTokenExpire: Date,
    // Optional contact fields
    countryCode: { type: String, default: null },
    phoneNumber: { type: String, default: null },
    phoneVerified: { type: Boolean, default: false },
    // Optional address/location fields
    address: { type: String, default: null },
    city: { type: String, default: null },
    state: { type: String, default: null },
    country: { type: String, default: null },
    postalCode: { type: String, default: null },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
    },
    timezone: { type: String, default: null },
    kycStatus: {
      type: String,
      enum: ["pending", "approved", "rejected", "not_required"],
      default: "not_required",
    },
    kycDocuments: [{ type: String }],
    // User must agree to terms and conditions
    acceptLegal: { type: Boolean, required: true },
  },
  { timestamps: true }
);

userSchema.pre<IUser>("save", async function (next) {
  // Set isVerified to true for social login users
  if (this.authProvider !== "local") {
    this.isVerified = true;
  }
  
  if (!this.isModified("password") || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function (
  password: string
): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(password, this.password);
};

const UserModel: Model<IUser> = mongoose.model<IUser>("User", userSchema);
export default UserModel;

// Geospatial index for location
userSchema.index({ location: "2dsphere" });
