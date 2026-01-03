import { Router } from "express";
import {
  createEducationLoanRequest,
  getEducationLoanRequests,
  getEducationLoanRequest,
  updateEducationLoanRequestStatus,
  updateEducationLoanDocuments,
  deleteEducationLoanRequest,
} from "../controllers/educationLoan.controller";
import authGuard from "../../../middlewares/auth.middleware";

const router = Router();

router.use(authGuard); // All routes require authentication
router.post("/education-loan", createEducationLoanRequest);
router.get("/education-loan", getEducationLoanRequests);
router.get("/education-loan/:id", getEducationLoanRequest);
router.patch("/education-loan/:id", updateEducationLoanRequestStatus);
router.patch("/education-loan/:id/documents", updateEducationLoanDocuments);
router.delete("/education-loan/:id", deleteEducationLoanRequest);

export default router;

