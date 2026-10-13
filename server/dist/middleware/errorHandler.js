"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.notFoundHandler = exports.AppError = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const zod_1 = require("zod");
class AppError extends Error {
    statusCode;
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
        this.name = "AppError";
    }
}
exports.AppError = AppError;
const notFoundHandler = (_req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found",
    });
};
exports.notFoundHandler = notFoundHandler;
const errorHandler = (error, _req, res, _next) => {
    if (error instanceof zod_1.ZodError) {
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
    if (error instanceof mongoose_1.default.Error.ValidationError ||
        error instanceof mongoose_1.default.Error.CastError) {
        res.status(400).json({
            success: false,
            message: "Invalid candidate data",
        });
        return;
    }
    if (error instanceof mongoose_1.default.mongo.MongoServerError &&
        error.code === 11000) {
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
exports.errorHandler = errorHandler;
