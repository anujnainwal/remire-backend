import pino from "pino";
import path from "path";
import fs from "fs";

// Ensure logs directory exists
const logsDir = path.join(__dirname, "../../logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

const logger = pino({
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

export default logger;
