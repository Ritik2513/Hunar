"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const providerEventSchema = new mongoose_1.Schema({
    providerEventId: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    providerMessageId: {
        type: String,
        required: true,
        index: true,
    },
    communicationId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Communication",
        required: true,
        index: true,
    },
    eventType: {
        type: String,
        enum: ["sent", "delivered", "failed"],
        required: true,
    },
    payload: {
        type: mongoose_1.Schema.Types.Mixed,
        default: {},
    },
    receivedAt: {
        type: Date,
        default: Date.now,
    },
    processedAt: {
        type: Date,
        default: null,
    },
}, {
    timestamps: true,
    versionKey: false,
});
const ProviderEvent = (0, mongoose_1.model)("ProviderEvent", providerEventSchema);
exports.default = ProviderEvent;
