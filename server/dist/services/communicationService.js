"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendCommunication = sendCommunication;
exports.listCandidateCommunications = listCandidateCommunications;
exports.processProviderCallback = processProviderCallback;
const node_crypto_1 = require("node:crypto");
const mongoose_1 = __importDefault(require("mongoose"));
const Candidate_js_1 = __importDefault(require("../models/Candidate.js"));
const Communication_js_1 = __importDefault(require("../models/Communication.js"));
const ProviderEvent_js_1 = __importDefault(require("../models/ProviderEvent.js"));
const errorHandler_js_1 = require("../middleware/errorHandler.js");
const communicationEnv_js_1 = require("../config/communicationEnv.js");
async function sendCommunication(input) {
    if (!mongoose_1.default.isValidObjectId(input.candidateId)) {
        throw new errorHandler_js_1.AppError(400, "Invalid candidate ID");
    }
    const candidate = await Candidate_js_1.default.findById(input.candidateId).lean();
    if (!candidate) {
        throw new errorHandler_js_1.AppError(404, "Candidate not found");
    }
    const recipient = input.channel === "email" ? candidate.email : candidate.phone;
    const communication = await Communication_js_1.default.create({
        candidateId: candidate._id,
        channel: input.channel,
        recipient,
        subject: input.subject ?? "",
        body: input.body,
        status: "sending",
        attempts: [
            {
                attemptNumber: 1,
                status: "started",
                providerMessageId: null,
                startedAt: new Date(),
                completedAt: null,
                errorMessage: null,
            },
        ],
    });
    try {
        const response = await fetch(`${communicationEnv_js_1.env.PROVIDER_URL}/api/provider/send`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                communicationId: communication._id.toString(),
                attemptNumber: 1,
                channel: input.channel,
                recipient,
                subject: input.subject ?? "",
                body: input.body,
                simulateOutcome: "success",
            }),
            signal: AbortSignal.timeout(7000),
        });
        const result = (await response.json());
        if (!response.ok || !result.success || !result.data?.providerMessageId) {
            throw new Error(result.message ?? `Provider returned HTTP ${response.status}`);
        }
        const providerMessageId = result.data.providerMessageId;
        communication.attempts[0].providerMessageId = providerMessageId;
        communication.attempts[0].status = "sent";
        communication.attempts[0].completedAt = new Date();
        communication.status = "sent";
        await communication.save();
        return communication.toObject();
    }
    catch (error) {
        communication.status = "failed";
        communication.attempts[0].status = "failed";
        communication.attempts[0].completedAt = new Date();
        communication.attempts[0].errorMessage =
            error instanceof Error ? error.message : "Unknown provider error";
        await communication.save();
        return {
            ...communication.toObject(),
            providerError: "The provider did not accept the message",
        };
    }
}
async function listCandidateCommunications(candidateId) {
    if (!mongoose_1.default.isValidObjectId(candidateId)) {
        throw new errorHandler_js_1.AppError(400, "Invalid candidate ID");
    }
    const candidateExists = await Candidate_js_1.default.exists({ _id: candidateId });
    if (!candidateExists) {
        throw new errorHandler_js_1.AppError(404, "Candidate not found");
    }
    return Communication_js_1.default.find({ candidateId }).sort({ createdAt: -1 }).lean();
}
function hasValidSecret(receivedSecret) {
    if (!receivedSecret)
        return false;
    const expected = Buffer.from(communicationEnv_js_1.env.PROVIDER_CALLBACK_SECRET);
    const received = Buffer.from(receivedSecret);
    return (expected.length === received.length && (0, node_crypto_1.timingSafeEqual)(expected, received));
}
async function processProviderCallback(event, receivedSecret) {
    if (!hasValidSecret(receivedSecret)) {
        throw new errorHandler_js_1.AppError(401, "Invalid provider callback secret");
    }
    let savedEvent;
    try {
        savedEvent = await ProviderEvent_js_1.default.create({
            providerEventId: event.eventId,
            providerMessageId: event.providerMessageId,
            communicationId: event.communicationId,
            eventType: event.eventType,
            payload: event,
        });
    }
    catch (error) {
        if (error instanceof mongoose_1.default.mongo.MongoServerError &&
            error.code === 11000) {
            return { duplicate: true };
        }
        throw error;
    }
    try {
        const communication = await Communication_js_1.default.findById(event.communicationId);
        if (!communication) {
            throw new errorHandler_js_1.AppError(404, "Communication not found");
        }
        const attempt = communication.attempts.find((item) => item.attemptNumber === event.attemptNumber);
        if (!attempt || attempt.providerMessageId !== event.providerMessageId) {
            throw new errorHandler_js_1.AppError(409, "Provider message does not match an attempt");
        }
        // Delivery is terminal: delayed events cannot downgrade it.
        if (communication.status !== "delivered") {
            if (event.eventType === "delivered") {
                communication.status = "delivered";
                attempt.status = "delivered";
                attempt.errorMessage = null;
                attempt.completedAt = new Date(event.occurredAt);
            }
            else if (event.eventType === "failed") {
                // Ignore an older attempt's failure after a newer retry started.
                const latestAttemptNumber = Math.max(...communication.attempts.map((item) => item.attemptNumber));
                if (event.attemptNumber === latestAttemptNumber) {
                    communication.status = "failed";
                    attempt.status = "failed";
                    attempt.errorMessage = event.errorMessage ?? "Delivery failed";
                    attempt.completedAt = new Date(event.occurredAt);
                }
            }
            else if (communication.status !== "failed" &&
                event.attemptNumber === communication.attempts.length) {
                communication.status = "sent";
                attempt.status = "sent";
                attempt.completedAt = new Date(event.occurredAt);
            }
        }
        await communication.save();
        savedEvent.processedAt = new Date();
        await savedEvent.save();
        return { duplicate: false };
    }
    catch (error) {
        if (!savedEvent.processedAt) {
            await ProviderEvent_js_1.default.deleteOne({ _id: savedEvent._id });
        }
        throw error;
    }
}
