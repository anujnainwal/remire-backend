import { Router } from "express";
import {
  createNriRepatriationOrder,
  getNriRepatriationOrders,
  getNriRepatriationOrder,
  updateNriRepatriationOrderStatus,
  updateNriDetails,
  updateComplianceDocuments,
} from "../controllers/nriRepatriation.controller";
import authGuard from "../../../middlewares/auth.middleware";

const router = Router();

// Protected routes
router.use(authGuard);
router.post("/nri-repatriation", createNriRepatriationOrder);
router.get("/nri-repatriation", getNriRepatriationOrders);
router.get("/nri-repatriation/:id", getNriRepatriationOrder);
router.patch("/nri-repatriation/:id", updateNriRepatriationOrderStatus);
router.patch("/nri-repatriation/:id/nri-details", updateNriDetails);
router.patch(
  "/nri-repatriation/:id/compliance-documents",
  updateComplianceDocuments
);

export default router;

