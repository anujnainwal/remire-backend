import { Request, Response } from "express";
import { responseHelper } from "../../../../utils/responseHelper";
import { generateSlug } from "../../../../utils/slugify.util";
import StaticContentModel from "../models/static-content.model";


export const updateStaticContent = async (req: Request, res: Response) => {
  try {
    const { type } = req.body; // about, privacy, terms-and-conditions
    const payload = req.body;

    if (!type) {
      return responseHelper.error(res, "Content type is required", 400);
    }

    if (!payload || Object.keys(payload).length === 0) {
      return responseHelper.error(res, "No fields provided", 400);
    }

    // Generate slug automatically on title update
    if (payload.title) {
      payload.slug = generateSlug(payload.title);
    }

    // Allowed content types
    const allowedTypes = ["about", "privacy", "terms-and-conditions"];

    if (!allowedTypes.includes(type)) {
      return responseHelper.error(res, "Invalid static content type", 400);
    }

    // Find the specific document by type
    const updatedDoc:any = await StaticContentModel.findOneAndUpdate(
      { type },
      { $set: payload },
      { new: true, upsert: true, runValidators: true } 
    );

    return responseHelper.success(res, "Content updated successfully", updatedDoc);
  } catch (error: any) {
    return responseHelper.error(res, error.message || "Server error", 500);
  }
};

