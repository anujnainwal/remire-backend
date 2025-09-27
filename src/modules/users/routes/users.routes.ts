import { Router } from "express";
import {
  getProfile,
  updateProfile,
  changePassword,
  updateSettings,
} from "../controllers/users.controller";
import authGuard from "../../../middlewares/auth.middleware";
import customerRoutes from "./customer.routes";

const router = Router();

// User profile routes
router.get("/profile", authGuard, getProfile);
router.patch("/profile", authGuard, updateProfile);
router.post("/change-password", authGuard, changePassword);
router.put("/settings", authGuard, updateSettings);

// Customer management routes (Admin/Super Admin only)
router.use("/customers", customerRoutes);

export default router;
