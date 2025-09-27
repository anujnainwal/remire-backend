import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAuth extends Document {
  userId: mongoose.Types.ObjectId;
  deviceId?: string;
  deviceType:
    | "local"
    | "web"
    | "mobile"
    | "tablet"
    | "desktop"
    | "ios"
    | "android";
  refreshToken: string;
  userAgent?: string;
  ipAddress?: string;
  fcmToken?: string;
  expiresAt: Date;
  revoked: boolean;
  revokedAt?: Date | null;
  replacedByToken?: string | null;

  // Methods
  revoke(): Promise<IAuth>;
  isActive(): boolean;
  updateFcmToken(fcmToken: string): Promise<IAuth>;
}

const authSchema: Schema<IAuth> = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    deviceId: {
      type: String,
      default: null,
    },
    deviceType: {
      type: String,
      enum: ["web", "mobile", "tablet", "desktop", "ios", "android", "local"],
      default: "local",
    },
    refreshToken: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
    ipAddress: {
      type: String,
      default: null,
    },
    fcmToken: {
      type: String,
      default: null,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // TTL index
    },
    revoked: {
      type: Boolean,
      default: false,
    },
    revokedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "auth",
  }
);

// Index for fast lookup by userId & deviceId
authSchema.index({ userId: 1, deviceId: 1 });
// Index for fast lookup by userId + userAgent + deviceType (used when reusing sessions)
authSchema.index({ userId: 1, userAgent: 1, deviceType: 1 });

// Methods

authSchema.methods.revoke = async function (): Promise<IAuth> {
  this.revoked = true;
  this.revokedAt = new Date();
  return this.save();
};

authSchema.methods.isActive = function (): boolean {
  return !this.revoked && new Date() < this.expiresAt;
};

authSchema.methods.updateFcmToken = async function (
  fcmToken: string
): Promise<IAuth> {
  this.fcmToken = fcmToken;
  return this.save();
};

// Model
const AuthModel: Model<IAuth> = mongoose.model<IAuth>("Auth", authSchema);

export default AuthModel;
