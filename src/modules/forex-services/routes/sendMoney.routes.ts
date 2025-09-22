import { Router } from "express";
import {
  createSendMoneyOrder,
  getSendMoneyOrders,
  getSendMoneyOrder,
  updateSendMoneyOrderStatus,
  getExchangeRates,
} from "../controllers/sendMoney.controller";
import authGuard from "../../../middlewares/auth.middleware";

const router = Router();

// Public routes
router.get("/exchange-rates", getExchangeRates);

// Protected routes
router.use(authGuard);
router.post("/send-money", createSendMoneyOrder);
router.get("/send-money", getSendMoneyOrders);
router.get("/send-money/:id", getSendMoneyOrder);
router.patch("/send-money/:id", updateSendMoneyOrderStatus);

export default router;

