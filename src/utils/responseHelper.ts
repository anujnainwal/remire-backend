import { Response, Request } from "express";
import logger from "../config/logger";

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

// Helper function to log error responses
const logErrorResponse = (req: Request, res: Response, statusCode: number, message: string, data?: any) => {
  const errorLog = {
    error: message,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    body: req.body,
    query: req.query,
    params: req.params,
    headers: {
      authorization: req.headers.authorization ? 'Bearer [REDACTED]' : undefined,
      'content-type': req.headers['content-type'],
      'content-length': req.headers['content-length']
    },
    statusCode: statusCode,
    timestamp: new Date().toISOString(),
    responseData: data
  };

  if (statusCode >= 500) {
    logger.error(errorLog, `${statusCode} - Server Error`);
  } else if (statusCode === 404) {
    logger.warn(errorLog, `${statusCode} - Not Found`);
  } else if (statusCode === 401) {
    logger.warn(errorLog, `${statusCode} - Unauthorized`);
  } else if (statusCode >= 400) {
    logger.warn(errorLog, `${statusCode} - Bad Request`);
  }
};

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
    code = HttpStatus.BAD_REQUEST,
    req?: Request
  ) {
    if (req) {
      logErrorResponse(req, res, code, message);
    }
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

  serverError(res: Response, message = "Internal server error", req?: Request) {
    if (req) {
      logErrorResponse(req, res, HttpStatus.SERVER_ERROR, message);
    }
    const response: ApiResponse<null> = {
      status: false,
      message,
      code: HttpStatus.SERVER_ERROR,
    };
    return res.status(HttpStatus.SERVER_ERROR).json(response);
  },

  unauthorized(res: Response, message = "Authentication required", req?: Request) {
    if (req) {
      logErrorResponse(req, res, HttpStatus.UNAUTHORIZED, message);
    }
    const response: ApiResponse<null> = {
      status: false,
      message,
      code: HttpStatus.UNAUTHORIZED,
    };
    return res.status(HttpStatus.UNAUTHORIZED).json(response);
  },

  forbidden(res: Response, message = "Forbidden", req?: Request) {
    if (req) {
      logErrorResponse(req, res, HttpStatus.FORBIDDEN, message);
    }
    const response: ApiResponse<null> = {
      status: false,
      message,
      code: HttpStatus.FORBIDDEN,
    };
    return res.status(HttpStatus.FORBIDDEN).json(response);
  },

  notFound(res: Response, message = "Resource not found", req?: Request) {
    if (req) {
      logErrorResponse(req, res, HttpStatus.NOT_FOUND, message);
    }
    const response: ApiResponse<null> = {
      status: false,
      message,
      code: HttpStatus.NOT_FOUND,
    };
    return res.status(HttpStatus.NOT_FOUND).json(response);
  },

  badRequest(res: Response, message = "Bad request", req?: Request) {
    if (req) {
      logErrorResponse(req, res, HttpStatus.BAD_REQUEST, message);
    }
    const response: ApiResponse<null> = {
      status: false,
      message,
      code: HttpStatus.BAD_REQUEST,
    };
    return res.status(HttpStatus.BAD_REQUEST).json(response);
  },

  validationError(res: Response, message = "Validation error", req?: Request) {
    if (req) {
      logErrorResponse(req, res, HttpStatus.VALIDATION_ERROR, message);
    }
    const response: ApiResponse<null> = {
      status: false,
      message,
      code: HttpStatus.VALIDATION_ERROR,
    };
    return res.status(HttpStatus.VALIDATION_ERROR).json(response);
  },
};
