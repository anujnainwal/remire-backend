import { Response } from "express";

// HTTP status codes enum
export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  VALIDATION_ERROR = 422,
  SERVER_ERROR = 500,
}

// Generic API Response type
export interface ApiResponse<T = unknown> {
  status: boolean;
  message: string;
  code: number;
  data?: T;
  requestId?: string; // optional tracking ID
}

export const responseHelper = {
  created<T>(res: Response, data: T, message = "Resource created") {
    const response: ApiResponse<T> = {
      status: true,
      message,
      code: HttpStatus.CREATED,
      data,
    };
    return res.status(HttpStatus.CREATED).json(response);
  },

  success<T>(res: Response, data: T, message = "Success") {
    const response: ApiResponse<T> = {
      status: true,
      message,
      code: HttpStatus.OK,
      data,
    };
    return res.status(HttpStatus.OK).json(response);
  },

  info<T>(res: Response, message: string, data?: T) {
    const response: ApiResponse<T> = {
      status: true,
      message,
      code: HttpStatus.OK,
      data,
    };
    return res.status(HttpStatus.OK).json(response);
  },

  error(
    res: Response,
    message = "An error occurred",
    code = HttpStatus.BAD_REQUEST
  ) {
    const response: ApiResponse<null> = {
      status: false,
      message,
      code,
    };
    return res.status(code).json(response);
  },

  payment<T>(res: Response, data: T, message = "Payment processed") {
    const response: ApiResponse<T> = {
      status: true,
      message,
      code: HttpStatus.OK,
      data,
    };
    return res.status(HttpStatus.OK).json(response);
  },

  serverError(res: Response, message = "Internal server error") {
    const response: ApiResponse<null> = {
      status: false,
      message,
      code: HttpStatus.SERVER_ERROR,
    };
    return res.status(HttpStatus.SERVER_ERROR).json(response);
  },

  unauthorized(res: Response, message = "Authentication required") {
    const response: ApiResponse<null> = {
      status: false,
      message,
      code: HttpStatus.UNAUTHORIZED,
    };
    return res.status(HttpStatus.UNAUTHORIZED).json(response);
  },

  forbidden(res: Response, message = "Forbidden") {
    const response: ApiResponse<null> = {
      status: false,
      message,
      code: HttpStatus.FORBIDDEN,
    };
    return res.status(HttpStatus.FORBIDDEN).json(response);
  },

  notFound(res: Response, message = "Resource not found") {
    const response: ApiResponse<null> = {
      status: false,
      message,
      code: HttpStatus.NOT_FOUND,
    };
    return res.status(HttpStatus.NOT_FOUND).json(response);
  },

  badRequest(res: Response, message = "Bad request") {
    const response: ApiResponse<null> = {
      status: false,
      message,
      code: HttpStatus.BAD_REQUEST,
    };
    return res.status(HttpStatus.BAD_REQUEST).json(response);
  },

  validationError(res: Response, message = "Validation error") {
    const response: ApiResponse<null> = {
      status: false,
      message,
      code: HttpStatus.VALIDATION_ERROR,
    };
    return res.status(HttpStatus.VALIDATION_ERROR).json(response);
  },
};
