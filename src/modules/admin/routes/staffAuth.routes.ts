import { Router } from "express";
import {
  staffLogin,
  staffRegister,
  changePassword,
  forgotPassword,
  resetPassword,
  staffLogout,
  getStaffProfile,
} from "../controllers/staffAuth.controller";
import { authMiddleware } from "../../../middlewares/auth.middleware";

const router = Router();

// Public routes
router.post("/login", staffLogin);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// Protected routes
router.use(authMiddleware); // Apply auth middleware to all routes below

router.post("/register", staffRegister);
router.post("/logout", staffLogout);
router.get("/profile", getStaffProfile);
router.put("/change-password", changePassword);

export default router;

