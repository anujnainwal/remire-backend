import express, { Request, Response, NextFunction } from "express";
import morgan from "morgan";
import logger from "./config/logger";
import { responseHelper } from "./utils/responseHelper";
import authRouter from "./modules/auth/routes/auth.routes";
import usersRouter from "./modules/users/routes/users.routes";
import sendMoneyRouter from "./modules/forex-services/routes/sendMoney.routes";
import nriRepatriationRouter from "./modules/forex-services/routes/nriRepatriation.routes";
import germanBlockedAccountRouter from "./modules/forex-services/routes/germanBlockedAccount.routes";
import gicPaymentRouter from "./modules/forex-services/routes/gicPayment.routes";
import createGicAccountRouter from "./modules/forex-services/routes/createGicAccount.routes";
import educationLoanRouter from "./modules/forex-services/routes/educationLoan.routes";
import orderRouter from "./modules/forex-services/routes/order.routes";
import cartRouter from "./modules/forex-services/routes/cart.routes";
import paymentRouter from "./modules/forex-services/routes/payment.routes";
import cors from "cors";
import cookieParser from "cookie-parser";
import { corsOption } from "./config/corsOptions";

const app = express();

app.use(cors(corsOption));
app.use(express.json());

// Use cookie-parser for secure cookie handling
app.use(cookieParser(process.env.COOKIE_SECRET));
// parse URL-encoded body if needed
app.use(express.urlencoded({ extended: true }));
app.use(
  morgan("dev", {
    stream: {
      write: (message: string) => logger.info(message.trim()),
    },
  })
);

// Example: Log all incoming requests (optional, for custom logging)
app.use((req: Request, res: Response, next: NextFunction) => {
  logger.debug(
    { method: req.method, url: req.url, ip: req.ip },
    "Incoming request"
  );
  next();
});

// Redirect base URL '/' to '/health-check'
app.get("/", (req: Request, res: Response) => {
  return res.redirect("/health-check");
});
app.get("/health-check", async (req: Request, res: Response) => {
  const healthData = {
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  };
  return responseHelper.info(res, "Server is healthy", healthData);
});

// Auth Routes (tokens will be set as secure HTTP-only cookies in controllers)
app.use("/api/v1/auth", authRouter);
// Users Routes
app.use("/api/v1/users", usersRouter);
// Forex Services Routes
app.use("/api/v1/forex", sendMoneyRouter);
app.use("/api/v1/forex", nriRepatriationRouter);
app.use("/api/v1/forex", germanBlockedAccountRouter);
app.use("/api/v1/forex", gicPaymentRouter);
app.use("/api/v1/forex", createGicAccountRouter);
app.use("/api/v1/forex", educationLoanRouter);
app.use("/api/v1/forex", orderRouter);
app.use("/api/v1/forex", cartRouter);
app.use("/api/v1/forex", paymentRouter);

// 404 not found - register a catch-all handler without a string path
// to avoid path-to-regexp parsing issues (some versions treat '/*' as an invalid token).
app.use((req: Request, res: Response) => {
  return responseHelper.notFound(res, "Route not found");
});

// Error logging middleware (should be after all routes)
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error(
    {
      message: err.message,
      stack: err.stack,
      method: req.method,
      url: req.url,
      ip: req.ip,
    },
    "Unhandled error"
  );
  responseHelper.serverError(res, "Internal server error");
  return;
});

export default app;
