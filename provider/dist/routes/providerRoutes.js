"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const deliveryService_1 = require("../services/deliveryService");
const router = (0, express_1.Router)();
const sendMessageSchema = zod_1.z
    .object({
    communicationId: zod_1.z.string().regex(/^[a-f\d]{24}$/i),
    attemptNumber: zod_1.z.number().int().min(1),
    channel: zod_1.z.enum(["email", "sms"]),
    recipient: zod_1.z.string().trim().min(1).max(254),
    subject: zod_1.z.string().max(200).optional(),
    body: zod_1.z.string().trim().min(1).max(10000),
    simulateOutcome: zod_1.z.enum(["success", "failure", "outage"]).optional(),
})
    .strict();
const sendMessageHandler = async (req, res, next) => {
    try {
        const parsed = sendMessageSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({
                success: false,
                message: "Invalid provider request",
                errors: parsed.error.issues.map((issue) => ({
                    field: issue.path.join("."),
                    message: issue.message,
                })),
            });
            return;
        }
        const result = await (0, deliveryService_1.submitDelivery)(parsed.data);
        res.status(202).json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        if (error instanceof deliveryService_1.ProviderOutageError) {
            res.status(503).json({
                success: false,
                message: error.message,
            });
            return;
        }
        next(error);
    }
};
router.post("/send", sendMessageHandler);
exports.default = router;
