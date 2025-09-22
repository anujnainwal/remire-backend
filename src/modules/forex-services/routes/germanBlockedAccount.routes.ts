import { Router } from "express";
import {
  createGermanBlockedAccountOrder,
  getGermanBlockedAccountOrders,
  getGermanBlockedAccountOrder,
  updateGermanBlockedAccountOrderStatus,
  updateGermanDetails,
  updateComplianceDocuments,
  getExchangeRates,
} from "../controllers/germanBlockedAccount.controller";
import authGuard from "../../../middlewares/auth.middleware";

const router = Router();

router.get("/exchange-rates", getExchangeRates); // Public route for exchange rates

router.use(authGuard); // All routes below this require authentication
router.post("/german-blocked-account", createGermanBlockedAccountOrder);
router.get("/german-blocked-account", getGermanBlockedAccountOrders);
router.get("/german-blocked-account/:id", getGermanBlockedAccountOrder);
router.patch(
  "/german-blocked-account/:id",
  updateGermanBlockedAccountOrderStatus
);
router.patch("/german-blocked-account/:id/german-details", updateGermanDetails);
router.patch(
  "/german-blocked-account/:id/compliance-documents",
  updateComplianceDocuments
);

export default router;

