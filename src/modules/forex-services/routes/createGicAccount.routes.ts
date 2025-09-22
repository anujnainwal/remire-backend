import { Router } from "express";
import {
  createGicAccountRequest,
  getGicAccountRequests,
  getGicAccountRequest,
  updateGicAccountRequestStatus,
} from "../controllers/createGicAccount.controller";
import authGuard from "../../../middlewares/auth.middleware";

const router = Router();

router.use(authGuard); // All routes require authentication
router.post("/create-gic-account", createGicAccountRequest);
router.get("/create-gic-account", getGicAccountRequests);
router.get("/create-gic-account/:id", getGicAccountRequest);
router.patch("/create-gic-account/:id", updateGicAccountRequestStatus);

export default router;

