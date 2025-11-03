import mongoose, { Schema, Document, Model } from "mongoose";

/**
 * @description Interface for exchange rate data
 */
export interface IExchangeRate extends Document {
  base_code: string; // Base currency (e.g., "USD")
  provider: string; // API provider (e.g., "ExchangeRate-API")
  conversion_rates: Record<string, number>; // Key-value pair (e.g., { "INR": 83.12, "EUR": 0.92 })
  lastUpdatedAt: Date; // When this rate was fetched from provider
  requestCount?: number; // Optional tracking for API usage
  success: boolean; // Whether the fetch was successful
  meta: {
    apiVersion?: string;
    fetchDurationMs?: number;
    environment?: "production" | "staging" | "development";
  };
  createdAt: Date;
  updatedAt: Date;
}

const exchangeRateSchema: Schema<IExchangeRate> = new Schema(
  {
    base_code: { type: String, required: true, uppercase: true, index: true },
    provider: { type: String, default: "ExchangeRate-API" },

    // Example: { "INR": 83.12, "EUR": 0.92, "JPY": 150.5, ... }
    conversion_rates: { type: Map, of: Number, required: true },

    lastUpdatedAt: { type: Date, default: Date.now },
    requestCount: { type: Number, default: 0 },
    success: { type: Boolean, default: true },

    meta: {
      apiVersion: { type: String, default: "v6" },
      fetchDurationMs: { type: Number, default: 0 },
      environment: {
        type: String,
        enum: ["production", "staging", "development"],
        default: "production",
      },
    },
  },
  { timestamps: true }
);

// Index for faster queries by base currency and timestamp
exchangeRateSchema.index({ base_code: 1, lastUpdatedAt: -1 });

const ExchangeRateModel: Model<IExchangeRate> = mongoose.model<IExchangeRate>(
  "ExchangeRate",
  exchangeRateSchema
);

export default ExchangeRateModel;
