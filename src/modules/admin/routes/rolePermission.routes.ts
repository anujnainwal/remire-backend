import { Router } from "express";
import {
  createPermission,
  getAllPermissions,
  updatePermission,
  deletePermission,
  createRole,
  getAllRoles,
  updateRole,
  deleteRole,
  assignPermissionsToStaff,
  getStaffWithPermissions,
  manualSeedSuperAdminEndpoint,
} from "../controllers/rolePermission.controller";
import { authMiddleware } from "../../../middlewares/auth.middleware";

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Permission routes
router.post("/permissions", createPermission);
router.get("/permissions", getAllPermissions);
router.put("/permissions/:id", updatePermission);
router.delete("/permissions/:id", deletePermission);

// Role routes
router.post("/roles", createRole);
router.get("/roles", getAllRoles);
router.put("/roles/:id", updateRole);
router.delete("/roles/:id", deleteRole);

// Staff management routes
router.get("/staff", getStaffWithPermissions);
router.post("/staff/assign-permissions", assignPermissionsToStaff);

// System management routes
router.post("/seed-super-admin", manualSeedSuperAdminEndpoint);

export default router;
