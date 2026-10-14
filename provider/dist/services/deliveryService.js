"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProviderOutageError = void 0;
exports.submitDelivery = submitDelivery;
const node_crypto_1 = require("node:crypto");
const env_js_1 = require("../config/env.js");
class ProviderOutageError extends Error {
    constructor(message) {
        super(message);
        this.name = "ProviderOutageError";
    }
}
exports.ProviderOutageError = ProviderOutageError;
async function sendCallback(event) {
    const response = await fetch(`${env_js_1.env.MAIN_API_URL}/api/webhooks/provider`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-provider-secret": env_js_1.env.PROVIDER_CALLBACK_SECRET,
        },
        body: JSON.stringify(event),
        signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) {
        throw new Error(`Callback failed with HTTP ${response.status}`);
    }
}
function scheduleCallback(event, delayMs) {
    setTimeout(() => {
        void sendCallback(event).catch((error) => {
            console.error(`Could not deliver provider event ${event.eventId}:`, error instanceof Error ? error.message : error);
        });
    }, delayMs);
}
async function submitDelivery(input) {
    const outcome = input.simulateOutcome ?? "success";
    if (outcome === "outage") {
        throw new ProviderOutageError("Simulated provider outage");
    }
    const providerMessageId = (0, node_crypto_1.randomUUID)();
    const baseEvent = {
        providerMessageId,
        communicationId: input.communicationId,
        attemptNumber: input.attemptNumber,
    };
    scheduleCallback({
        ...baseEvent,
        eventId: (0, node_crypto_1.randomUUID)(),
        eventType: "sent",
        occurredAt: new Date().toISOString(),
    }, 500);
    if (outcome === "success") {
        scheduleCallback({
            ...baseEvent,
            eventId: (0, node_crypto_1.randomUUID)(),
            eventType: "delivered",
            occurredAt: new Date().toISOString(),
        }, 1500);
    }
    else {
        scheduleCallback({
            ...baseEvent,
            eventId: (0, node_crypto_1.randomUUID)(),
            eventType: "failed",
            occurredAt: new Date().toISOString(),
            errorMessage: "Simulated delivery failure",
        }, 1500);
    }
    return { providerMessageId, status: "accepted" };
}
