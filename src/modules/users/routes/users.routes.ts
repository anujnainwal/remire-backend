import { Router } from "express";
import {
  getProfile,
  updateProfile,
  changePassword,
  updateSettings,
} from "../controllers/users.controller";
import authGuard from "../../../middlewares/auth.middleware";

const router = Router();

router.get("/profile", authGuard, getProfile);
router.patch("/profile", authGuard, updateProfile);
router.post("/change-password", authGuard, changePassword);
router.put("/settings", authGuard, updateSettings);

// TODO: add change-password and settings routes here

export default router;
