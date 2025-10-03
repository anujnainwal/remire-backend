import { Router } from "express";
import {
  createGicPaymentOrder,
  getGicPaymentOrders,
  getGicPaymentOrder,
  updateGicPaymentOrderStatus,
  updateCanadianDetails,
  updateComplianceDocuments,
  getExchangeRates,
} from "../controllers/gicPayment.controller";
import authGuard from "../../../middlewares/auth.middleware";
import { upload,  } from "../../../middlewares/multer.middleware";

const router = Router();

router.get("/exchange-rates", getExchangeRates); // Public route for exchange rates

router.use(authGuard); // All routes below this require authentication
router.post("/gic-payment", 
  upload.any(), // Accept any files
  // handleMulterError,
  createGicPaymentOrder
);
router.get("/gic-payment", getGicPaymentOrders);
router.get("/gic-payment/:id", getGicPaymentOrder);
router.patch("/gic-payment/:id", updateGicPaymentOrderStatus);
router.patch("/gic-payment/:id/canadian-details", updateCanadianDetails);
router.patch(
  "/gic-payment/:id/compliance-documents",
  updateComplianceDocuments
);

export default router;

