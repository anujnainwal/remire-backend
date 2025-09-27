import mongoose from "mongoose";
import logger from "./logger";

const ENV = process.env.NODE_ENV || "development";

const getMongoUri = (): string | undefined => {
  if (ENV === "production") {
    return process.env.MONGODB_URI_PROD || process.env.MONGODB_URI;
  }
  if (ENV === "development") {
    return process.env.MONGODB_URI_DEV || process.env.MONGODB_URI;
  }
  return process.env.MONGODB_URI;
};

// Singleton flag (avoid multiple connects)
let isConnected = false;

// Retry config
const MAX_RETRIES = 5;
let retries = 0;

export const connectToDB = async (): Promise<void> => {
  if (isConnected) {
    logger.info("⚡ Using existing MongoDB connection.");
    return;
  }

  const mongoUri = getMongoUri();

  if (!mongoUri) {
    logger.error("❌ MongoDB URI is not defined in environment variables.");
    process.exit(1);
  }

  const connect = async () => {
    try {
      await mongoose.connect(mongoUri, {
        dbName: process.env.MONGODB_DB_NAME || undefined,
        maxPoolSize: 20, // pool size for concurrent requests
        minPoolSize: 5, // keep idle sockets alive
        serverSelectionTimeoutMS: 5000, // fail fast if no server
        socketTimeoutMS: 45000, // close idle sockets
      });

      isConnected = true;
      logger.info(`✅ MongoDB connected [${ENV}]: ${mongoUri}`);

      // Listeners registered once
      mongoose.connection.on("disconnected", () => {
        isConnected = false;
        logger.warn("⚠️  MongoDB disconnected.");
      });

      mongoose.connection.on("reconnected", () => {
        isConnected = true;
        logger.info("🔄 MongoDB reconnected.");
      });

      mongoose.connection.on("error", (err) => {
        logger.error("❌ MongoDB connection error:", err);
      });

      // Graceful shutdown
      process.once("SIGINT", async () => {
        await mongoose.connection.close();
        logger.info("🔌 MongoDB connection closed (SIGINT).");
        process.exit(0);
      });

      process.once("SIGTERM", async () => {
        await mongoose.connection.close();
        logger.info("🔌 MongoDB connection closed (SIGTERM).");
        process.exit(0);
      });
    } catch (error: any) {
      logger.error(`❌ MongoDB connection error: ${error.message}`);

      if (retries < MAX_RETRIES) {
        retries++;
        const delay = retries * 2000; // exponential backoff (2s, 4s, 6s…)
        logger.warn(`🔄 Retrying to connect in ${delay / 1000}s... [Attempt ${retries}/${MAX_RETRIES}]`);
        setTimeout(connect, delay);
      } else {
        logger.error("❌ Max retries reached. Exiting...");
        process.exit(1);
      }
    }
  };

  await connect();
};
