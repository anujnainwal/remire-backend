import { Router } from "express";
import {
  createOrder,
  getOrders,
  getOrder,
  updateOrder,
  deleteOrder,
  getOrderByOrderNumber,
  updateOrderStatus,
  getOrderAnalytics,
} from "../controllers/order.controller";
import authGuard from "../../../middlewares/auth.middleware";

const router = Router();

router.use(authGuard); // All routes require authentication

// Order CRUD operations
router.post("/orders", createOrder);
router.get("/orders", getOrders);
router.get("/orders/analytics", getOrderAnalytics);
router.get("/orders/:id", getOrder);
router.get("/orders/order-number/:orderNumber", getOrderByOrderNumber);
router.put("/orders/:id", updateOrder);
router.patch("/orders/:id/status", updateOrderStatus);
router.delete("/orders/:id", deleteOrder);

export default router;

