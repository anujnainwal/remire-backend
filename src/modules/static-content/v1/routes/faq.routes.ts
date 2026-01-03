import express from "express";
import {
    createFaq,
    deleteFaq,
    getAllFaqs,
    getFaqById,
    updateFaq,
} from "../controllers/faq.controller";
import { authGuard } from "../../../../middlewares/auth.middleware";

const router = express.Router();

// Public routes (if needed, or protected for admin)
// Assuming admin access for CRUD
router.post("/", authGuard, createFaq);
router.get("/", authGuard, getAllFaqs); // Can be public if needed for frontend display
router.get("/:id", authGuard, getFaqById);
router.patch("/:id", authGuard, updateFaq);
router.delete("/:id", authGuard, deleteFaq);

export default router;
