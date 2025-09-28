import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import { responseHelper } from "../utils/responseHelper";

export const validateRequest = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body, query, and params
      const validationData = {
        ...req.body,
        ...req.query,
        ...req.params,
      };

      const validatedData = schema.parse(validationData);

      // Replace the original data with validated data
      req.body = validatedData;
      req.query = {};
      req.params = {};

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessage = error.issues
          .map((err: any) => `${err.path.join(".")}: ${err.message}`)
          .join(", ");

        return responseHelper.validationError(res, errorMessage);
      }

      return responseHelper.serverError(res, "Validation error");
    }
  };
};

