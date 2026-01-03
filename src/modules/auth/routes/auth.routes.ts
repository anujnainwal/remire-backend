import { Router } from "express";
import {
  register,
  login,
  logout,
  refreshAccessToken,
  forgotPasswordController,
  resetPasswordController,
} from "../controllers";
import { googleAuth, facebookAuth } from "../controllers/socialAuth.controller";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPasswordController);
router.patch("/reset-password", resetPasswordController);
router.post("/logout", logout);
router.post("/refresh-token", refreshAccessToken);

// Social login routes
router.post("/google", googleAuth);
router.post("/facebook", facebookAuth);

export default router;
