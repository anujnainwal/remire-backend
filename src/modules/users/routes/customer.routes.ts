import { Router } from "express";
import {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  blockCustomer,
  unblockCustomer,
  deleteCustomer,
  updateCustomerPassword,
  revokeCustomerAccess,
} from "../controllers/customer.controller";
import { authMiddleware } from "../../../middlewares/auth.middleware";

const router = Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Customer Management Routes (Admin/Super Admin Only)
router.get("/", getAllCustomers);
router.get("/:customerId", getCustomerById);
router.post("/", createCustomer);
router.put("/:customerId", updateCustomer);
router.delete("/:customerId", deleteCustomer);

// Customer Access Control Routes
router.post("/:customerId/block", blockCustomer);
router.post("/:customerId/unblock", unblockCustomer);
router.post("/:customerId/revoke-access", revokeCustomerAccess);

// Customer Password Management
router.put("/:customerId/password", updateCustomerPassword);

export default router;

