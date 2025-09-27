import { Router } from "express";
import {
  createRoleWithPermissions,
  getAllRolesWithPermissions,
  updateRoleWithPermissions,
  deleteRole,
  getUserAccessList,
  assignRoleToStaff,
  getAvailableRoles,
  updateStaff,
  deleteStaff,
} from "../controllers/staffAccessLevel.controller";
import { authMiddleware } from "../../../middlewares/auth.middleware";

const router = Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Role Management Routes (Super Admin Only)
router.post("/roles", createRoleWithPermissions);

router.get("/roles", getAllRolesWithPermissions);

router.put("/roles/:roleId", updateRoleWithPermissions);

router.delete("/roles/:roleId", deleteRole);

// User Access Management Routes (Super Admin Only)
router.get("/users", getUserAccessList);

router.post("/users/:staffId/assign-role", assignRoleToStaff);

router.put("/users/:staffId", updateStaff);

router.delete("/users/:staffId", deleteStaff);

router.get("/roles/available", getAvailableRoles);

export default router;
