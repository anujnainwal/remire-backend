import { Request, Response } from "express";
import Faq from "../models/faq.model";
import { responseHelper, HttpStatus } from "../../../../utils/responseHelper";

// Create FAQ
export const createFaq = async (req: Request, res: Response) => {
    try {
        const { question, answer, category, status, isPublished } = req.body;

        const newFaq = new Faq({
            question,
            answer,
            category,
            status,
            isPublished,
        });

        await newFaq.save();

        return responseHelper.created(res, newFaq, "FAQ created successfully");
    } catch (error: any) {
        return responseHelper.serverError(res, "Failed to create FAQ");
    }
};

// Get All FAQs (with pagination and filtering)
export const getAllFaqs = async (req: Request, res: Response) => {
    try {
        const { page = 1, limit = 10, status, category, search } = req.query;

        const query: any = {};

        if (status && status !== "all") {
            query.status = status;
        }

        if (category && category !== "all") {
            query.category = category;
        }

        if (search) {
            query.$or = [
                { question: { $regex: search, $options: "i" } },
                { answer: { $regex: search, $options: "i" } },
            ];
        }

        const faqs = await Faq.find(query)
            .sort({ createdAt: -1 })
            .skip((Number(page) - 1) * Number(limit))
            .limit(Number(limit));

        const total = await Faq.countDocuments(query);

        return responseHelper.success(res, {
            faqs,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / Number(limit)),
            },
        }, "FAQs fetched successfully");
    } catch (error: any) {
        return responseHelper.serverError(res, "Failed to fetch FAQs");
    }
};

// Get FAQ by ID
export const getFaqById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const faq = await Faq.findById(id);

        if (!faq) {
            return responseHelper.notFound(res, "FAQ not found");
        }

        return responseHelper.success(res, faq, "FAQ fetched successfully");
    } catch (error: any) {
        return responseHelper.serverError(res, "Failed to fetch FAQ");
    }
};

// Update FAQ
export const updateFaq = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const updatedFaq = await Faq.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true,
        });

        if (!updatedFaq) {
            return responseHelper.notFound(res, "FAQ not found");
        }

        return responseHelper.success(res, updatedFaq, "FAQ updated successfully");
    } catch (error: any) {
        return responseHelper.serverError(res, "Failed to update FAQ");
    }
};

// Delete FAQ
export const deleteFaq = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const deletedFaq = await Faq.findByIdAndDelete(id);

        if (!deletedFaq) {
            return responseHelper.notFound(res, "FAQ not found");
        }

        return responseHelper.success(res, null, "FAQ deleted successfully");
    } catch (error: any) {
        return responseHelper.serverError(res, "Failed to delete FAQ");
    }
};
