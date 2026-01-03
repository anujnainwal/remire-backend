import { Request, Response } from "express";
import { responseHelper } from "../../../../utils/responseHelper";
import StaticContentModel from "../models/static-content.model";

export const deleteStaticContent = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;

    const deletedDoc:any = await StaticContentModel.findByIdAndDelete(id);

    if (!deletedDoc) {
      return responseHelper.error(res, "Content not found", 404);
    }

    return responseHelper.success(res, "Content deleted successfully", deletedDoc);
  } catch (error: any) {
    return responseHelper.error(res, error.message || "Server error", 500);
  }
};
