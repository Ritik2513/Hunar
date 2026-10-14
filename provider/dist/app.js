"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const providerRoutes_js_1 = __importDefault(require("./routes/providerRoutes.js"));
const app = (0, express_1.default)();
app.use(express_1.default.json({ limit: "100kb" }));
app.get("/api/health", (_req, res) => {
    res.status(200).json({
        success: true,
        service: "hunar-provider",
        status: "healthy",
    });
});
app.use("/api/provider", providerRoutes_js_1.default);
const notFoundHandler = (_req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found",
    });
};
const errorHandler = (error, _req, res, _next) => {
    console.error("Provider error:", error);
    res.status(500).json({
        success: false,
        message: "Internal provider error",
    });
};
app.use(notFoundHandler);
app.use(errorHandler);
exports.default = app;
