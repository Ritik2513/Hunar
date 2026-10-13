"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const candidateSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        minLength: 2,
        maxLength: 100,
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        maxLength: 254,
    },
    phone: {
        type: String,
        required: true,
        trim: true,
        maxLength: 30,
    },
    jobTitle: {
        type: String,
        trim: true,
        maxLength: 100,
        default: "",
    },
    notes: {
        type: String,
        trim: true,
        maxLength: 2000,
        default: "",
    },
}, { timestamps: true, versionKey: false });
candidateSchema.index({ email: 1 }, { unique: true });
candidateSchema.index({ name: 1 });
const Candidate = (0, mongoose_1.model)("Candidate", candidateSchema);
exports.default = Candidate;
