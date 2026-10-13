import type { ErrorRequestHandler, RequestHandler } from "express";
import mongoose from "mongoose";
import { ZodError } from "zod";

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
};

export const errorHandler: ErrorRequestHandler = (
  error: unknown,
  _req,
  res,
  _next,
) => {
  if (error instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
    return;
  }

  if (
    error instanceof mongoose.Error.ValidationError ||
    error instanceof mongoose.Error.CastError
  ) {
    res.status(400).json({
      success: false,
      message: "Invalid candidate data",
    });
    return;
  }

  if (
    error instanceof mongoose.mongo.MongoServerError &&
    error.code === 11000
  ) {
    res.status(409).json({
      success: false,
      message: "A candidate with this email already exists",
    });
    return;
  }

  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
    return;
  }

  console.error("Unhandled application error:", error);

  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
};
