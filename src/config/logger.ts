import pino from "pino";

// Check if we're in production (serverless environment)
const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;

let logger: pino.Logger;

if (isProduction) {
  // Production/Serverless - simple console logging, no transport
  logger = pino({
    level: process.env.LOG_LEVEL || "info",
    // No transport in production - use default JSON output
  });
} else {
  // Development - use file logging
  const path = require("path");
  const fs = require("fs");
  
  // Create logs directory only in development
  const logsDir = path.join(__dirname, "../../logs");
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  logger = pino({
    level: process.env.LOG_LEVEL || "info",
    transport: {
      targets: [
        {
          target: "pino/file",
          options: {
            destination: path.join(logsDir, "success.log"),
            level: "info",
          },
          level: "info",
        },
        {
          target: "pino/file",
          options: {
            destination: path.join(logsDir, "error.log"),
            level: "error",
          },
          level: "error",
        },
        {
          target: "pino-pretty",
          options: { colorize: true },
          level: "debug",
        },
      ],
    },
  });
}

export default logger;
