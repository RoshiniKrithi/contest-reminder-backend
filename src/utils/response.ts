import { Response } from "express";

/**
 * Centrally manages success responses to keep front-end parsing easy.
 */
export const successResponse = (
  res: Response, 
  data: any, 
  message = "Operation successful", 
  status = 200
) => {
  res.status(status).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  });
};

/**
 * Standardized error response with explicit internal codes.
 */
export const errorResponse = (
  res: Response, 
  message = "Internal Server Error", 
  status = 500, 
  code = "INTERNAL_ERROR"
) => {
  res.status(status).json({
    success: false,
    error: {
      message,
      status,
      code,
      timestamp: new Date().toISOString()
    }
  });
};
