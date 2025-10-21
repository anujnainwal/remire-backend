import { Router } from "express";
import authGuard from "../../../middlewares/auth.middleware";
import { createForexCurrencyOrder, getForexCurrencyOrders } from "../controllers/forexCurrency.controller";

const router = Router();

router.use(authGuard);

router.post("/currency-exchange", createForexCurrencyOrder);
router.get("/currency-exchange", getForexCurrencyOrders);

export default router;


