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
    // User must agree to terms and conditions
    acceptLegal: { type: Boolean, required: true },
  },
  { timestamps: true }
);

userSchema.pre<IUser>("save", async function (next) {
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
