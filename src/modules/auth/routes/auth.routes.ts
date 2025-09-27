import { Router } from "express";
import {
  register,
  login,
  logout,
  refreshAccessToken,
  forgotPasswordController,
  resetPasswordController,
} from "../controllers";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPasswordController);
router.patch("/reset-password", resetPasswordController);
router.post("/logout", logout);
router.post("/refresh-token", refreshAccessToken);
export default router;
