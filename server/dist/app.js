"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const candidateRoutes_js_1 = __importDefault(require("./routes/candidateRoutes.js"));
const errorHandler_1 = require("./middleware/errorHandler");
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
}));
app.use(express_1.default.json({ limit: "100kb" }));
app.get("/api/health", (_req, res) => {
    res.status(200).json({
        success: true,
        message: "Hunar API is running",
    });
});
app.use("/api/candidates", candidateRoutes_js_1.default);
app.use(errorHandler_1.notFoundHandler);
app.use(errorHandler_1.errorHandler);
exports.default = app;
