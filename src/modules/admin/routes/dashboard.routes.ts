import { Router } from "express";
import { getDashboardMetrics, getDashboardAnalytics } from "../controllers/dashboard.controller";
import { authMiddleware } from "../../../middlewares/auth.middleware";

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Dashboard metrics route
router.get("/metrics", getDashboardMetrics);

// Dashboard analytics route (for charts and detailed data)
router.get("/analytics", getDashboardAnalytics);

export default router;


