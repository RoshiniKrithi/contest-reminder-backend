import { Response } from "express";

export const successResponse = (
  res: Response,
  data: any,
  message = "Operation successful",
  status = 200
) => {
  res.status(status).json({ success: true, message, data, timestamp: new Date().toISOString() });
};

export const errorResponse = (
  res: Response,
  message = "Internal Server Error",
  status = 500,
  code = "INTERNAL_ERROR"
) => {
  res.status(status).json({
    success: false,
    error: { message, status, code, timestamp: new Date().toISOString() },
  });
};
