import { Request, Response } from "express";
import { responseHelper } from "../../../../utils/responseHelper";
import StaticContentModel from "../models/static-content.model";

const fetchAllStaticContentByType = async (req: Request, res: Response) => {
  try {
    const { type } = req.query;

    const allowedTypes = ["about", "term-and-condition", "privacy-policy"];

    if (!type) {
      return responseHelper.error(res, "Type is required", 400);
    }

    if (!allowedTypes.includes(type as string)) {
      return responseHelper.error(res, "Invalid type", 400);
    }

    const docs: any = await StaticContentModel.find({ type }).sort({
      createdAt: -1,
    });

    return responseHelper.success(
      res,
      "Static content fetched successfully",
      docs
    );
  } catch (error: any) {
    return responseHelper.error(res, error.message || "Server error", 500);
  }
};

export default fetchAllStaticContentByType;
