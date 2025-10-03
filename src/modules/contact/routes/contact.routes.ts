import express from "express";
import { validateRequest } from "../../../middlewares/validateRequest.middleware";
import { contactMessageSchema, updateContactStatusSchema } from "../validations/contactValidation";
import {
  sendContactMessage,
  getContactMessages,
  getContactMessageById,
  updateContactMessage,
  deleteContactMessage,
  getContactStats,
} from "../controllers/contact.controller";
import { authGuard } from "../../../middlewares/auth.middleware";

const router = express.Router();

// Public routes (no authentication required)
router.post(
  "/contact/send-message",
  validateRequest(contactMessageSchema),
  sendContactMessage
);

// Protected routes (authentication required for admin access)
router.get(
  "/contact/messages",
  authGuard,
  getContactMessages
);

router.get(
  "/contact/messages/stats",
  authGuard,
  getContactStats
);

router.get(
  "/contact/messages/:id",
  authGuard,
  getContactMessageById
);

router.put(
  "/contact/messages/:id",
  authGuard,
  validateRequest(updateContactStatusSchema),
  updateContactMessage
);

router.delete(
  "/contact/messages/:id",
  authGuard,
  deleteContactMessage
);

export default router;
