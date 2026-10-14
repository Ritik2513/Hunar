"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.providerCallbackSchema = exports.candidateCommunicationHistorySchema = exports.sendCommunicationSchema = void 0;
const zod_1 = require("zod");
exports.sendCommunicationSchema = zod_1.z.object({
    body: zod_1.z
        .object({
        candidateId: zod_1.z.string().regex(/^[a-f\d]{24}$/i, "Invalid candidate ID"),
        channel: zod_1.z.enum(["email", "sms"]),
        subject: zod_1.z.string().trim().max(200).optional(),
        body: zod_1.z.string().trim().min(1).max(10000),
    })
        .strict(),
});
exports.candidateCommunicationHistorySchema = zod_1.z.object({
    params: zod_1.z.object({
        candidateId: zod_1.z.string().regex(/^[a-f\d]{24}$/i, "Invalid candidate ID"),
    }),
});
exports.providerCallbackSchema = zod_1.z.object({
    eventId: zod_1.z.string().uuid(),
    providerMessageId: zod_1.z.string().min(1).max(200),
    communicationId: zod_1.z.string().regex(/^[a-f\d]{24}$/i),
    attemptNumber: zod_1.z.number().int().min(1),
    eventType: zod_1.z.enum(["sent", "delivered", "failed"]),
    occurredAt: zod_1.z.string().datetime({ offset: true }),
    errorMessage: zod_1.z.string().max(1000).optional(),
});
