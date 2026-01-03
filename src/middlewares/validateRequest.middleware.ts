import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import { responseHelper } from "../utils/responseHelper";
import logger from "../config/logger";

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

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessage = error.issues
          .map((err: any) => `${err.path.join(".")}: ${err.message}`)
          .join(", ");

        logger.error({
          message: "Validation error",
          error: errorMessage,
          path: req.path,
          method: req.method,
        });

        return responseHelper.validationError(res, errorMessage);
      }

      logger.error({
        message: "Validation middleware error",
        error: error,
        path: req.path,
        method: req.method,
      });

      return responseHelper.serverError(res, "Validation error");
    }
  };
};

