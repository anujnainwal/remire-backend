import { Request, Response } from "express";
import { responseHelper } from "../../../../utils/responseHelper";
import { generateSlug } from "../../../../utils/slugify.util";
import StaticContentModel from "../models/static-content.model";


 const createStaticContent = async (req: Request, res: Response) => {
  try {
    const payload = req.body;

    if (!payload || !payload.title) {
      return responseHelper.error(res, "Title is required", 400);
    }
    const baseSlug = generateSlug(payload.title);
    

    const doc:any = await StaticContentModel.create({
      ...payload,
      slug:baseSlug,
    });

    return responseHelper.success(res, "Content created successfully", doc);
  } catch (error: any) {
    return responseHelper.error(res, error.message || "Server error", 500);
  }
};

export default createStaticContent