import express, { Request, Response, NextFunction } from "express";
import morgan from "morgan";
import logger from "./config/logger";
import { responseHelper } from "./utils/responseHelper";
import authRouter from "./modules/auth/routes/auth.routes";
import usersRouter from "./modules/users/routes/users.routes";
import staffAuthRouter from "./modules/admin/routes/staffAuth.routes";
import rolePermissionRouter from "./modules/admin/routes/rolePermission.routes";
import staffAccessLevelRouter from "./modules/admin/routes/staffAccessLevel.routes";
import dashboardRouter from "./modules/admin/routes/dashboard.routes";
import sendMoneyRouter from "./modules/forex-services/routes/sendMoney.routes";
import nriRepatriationRouter from "./modules/forex-services/routes/nriRepatriation.routes";
import germanBlockedAccountRouter from "./modules/forex-services/routes/germanBlockedAccount.routes";
import gicPaymentRouter from "./modules/forex-services/routes/gicPayment.routes";
import createGicAccountRouter from "./modules/forex-services/routes/createGicAccount.routes";
import educationLoanRouter from "./modules/forex-services/routes/educationLoan.routes";
import orderRouter from "./modules/forex-services/routes/order.routes";
import forexCurrencyRouter from "./modules/forex-services/routes/forexCurrency.routes";
import cartRouter from "./modules/forex-services/routes/cart.routes";
import paymentRouter from "./modules/forex-services/routes/payment.routes";
import webhookRouter from "./modules/forex-services/routes/webhook.routes";
import contactRouter from "./modules/contact/routes/contact.routes";
import cors from "cors";
import cookieParser from "cookie-parser";
import { corsOption } from "./config/corsOptions";
import { autoSeedSuperAdmin } from "./config/autoSeed";
import exchangeRouter from "./modules/forex-services/routes/exchange.route";
import { startCronJobs } from "./cron/scheduler/scheduler";
import staticRouter from "./modules/static-content/v1/routes/staticRoute.route";

const app = express();

app.use(cors({
  origin:"*"
}));

startCronJobs()

// Increase body parser limits for file uploads
// Skip JSON parsing for multipart routes
// app.use((req, res, next) => {
//   if (req.path.includes('/create-gic-account') || 
//       req.path.includes('/gic-payment') ||
//       req.path.includes('/upload') ||
//       req.path.includes('/contact')) {
//     return next(); // Skip JSON parsing for multipart routes
//   }
//   express.json({ limit: '50mb' })(req, res, next);
// });
app.use(  express.json({ limit: '50mb' }))

app.use(express.urlencoded({ 
  extended: true, 
  limit: '50mb' 
}));

// Use cookie-parser for secure cookie handling
app.use(cookieParser(process.env.COOKIE_SECRET));
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
// Staff Authentication Routes
app.use("/api/v1/staff", staffAuthRouter);
// Role and Permission Management Routes
app.use("/api/v1/admin", rolePermissionRouter);
// Staff Access Level Management Routes (Super Admin Only)
app.use("/api/v1/admin/access", staffAccessLevelRouter);
// Dashboard Analytics Routes
app.use("/api/v1/admin/dashboard", dashboardRouter);
// Forex Services Routes
app.use("/api/v1/forex", sendMoneyRouter);
app.use("/api/v1/forex", nriRepatriationRouter);
app.use("/api/v1/forex", germanBlockedAccountRouter);
app.use("/api/v1/forex", gicPaymentRouter);
app.use("/api/v1/forex", forexCurrencyRouter);
app.use("/api/v1/forex", createGicAccountRouter);
app.use("/api/v1/forex", educationLoanRouter);
app.use("/api/v1/forex", orderRouter);
app.use("/api/v1/forex", cartRouter);
app.use("/api/v1/forex", paymentRouter);
app.use("/api/v1/rate",exchangeRouter)
app.use("/api/v1/static",staticRouter)
app.use("/api/v1", webhookRouter);
// Contact Routes
app.use("/api/v1", contactRouter);

// 404 not found - register a catch-all handler without a string path
// to avoid path-to-regexp parsing issues (some versions treat '/*' as an invalid token).
app.use((req: Request, res: Response) => {
  return responseHelper.notFound(res, "Route not found");
});

// Error logging middleware (should be after all routes)
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  // Handle specific error types
  if (err.type === 'entity.too.large') {
    logger.error({
      error: "Request entity too large",
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      body: req.body,
      query: req.query,
      params: req.params,
      statusCode: 400
    }, "400 - Request too large");
    return responseHelper.badRequest(res, "Request entity too large. Maximum size is 50MB.");
  }
  
  if (err.code === 'LIMIT_FILE_SIZE') {
    logger.error({
      error: "File too large",
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      body: req.body,
      query: req.query,
      params: req.params,
      statusCode: 400
    }, "400 - File too large");
    return responseHelper.badRequest(res, "File too large. Maximum size is 10MB per file.");
  }
  
  if (err.code === 'LIMIT_FILE_COUNT') {
    logger.error({
      error: "Too many files",
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      body: req.body,
      query: req.query,
      params: req.params,
      statusCode: 400
    }, "400 - Too many files");
    return responseHelper.badRequest(res, "Too many files. Maximum 10 files allowed.");
  }

  // Determine status code
  const statusCode = err.statusCode || err.status || 500;
  
  // Log error with comprehensive details
  const errorLog = {
    error: err.message || "Unknown error",
    stack: err.stack,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    body: req.body,
    query: req.query,
    params: req.params,
    headers: {
      authorization: req.headers.authorization ? 'Bearer [REDACTED]' : undefined,
      'content-type': req.headers['content-type'],
      'content-length': req.headers['content-length']
    },
    statusCode: statusCode,
    timestamp: new Date().toISOString()
  };

  // Log based on status code
  if (statusCode >= 500) {
    logger.error(errorLog, "500 - Server Error");
  } else if (statusCode === 404) {
    logger.warn(errorLog, "404 - Not Found");
  } else if (statusCode === 401) {
    logger.warn(errorLog, "401 - Unauthorized");
  } else if (statusCode >= 400) {
    logger.warn(errorLog, "400 - Bad Request");
  } else {
    logger.error(errorLog, "Unhandled error");
  }

  // Send appropriate response
  if (statusCode >= 500) {
    responseHelper.serverError(res, "Internal server error");
  } else if (statusCode === 404) {
    responseHelper.notFound(res, "Route not found");
  } else if (statusCode === 401) {
    responseHelper.unauthorized(res, "Unauthorized");
  } else if (statusCode >= 400) {
    responseHelper.badRequest(res, err.message || "Bad request");
  } else {
    responseHelper.serverError(res, "Internal server error");
  }
  
  return;
});

export default app;
