"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCandidate = createCandidate;
exports.listCandidates = listCandidates;
exports.getCandidateById = getCandidateById;
exports.updateCandidate = updateCandidate;
exports.deleteCandidate = deleteCandidate;
const mongoose_1 = __importDefault(require("mongoose"));
const Candidate_js_1 = __importDefault(require("../models/Candidate.js"));
const errorHandler_js_1 = require("../middleware/errorHandler.js");
async function createCandidate(input) {
    return Candidate_js_1.default.create(input);
}
async function listCandidates(options) {
    const { search, page, limit } = options;
    const filter = {};
    if (search?.trim()) {
        const escapedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(escapedSearch, "i");
        filter.$or = [{ name: regex }, { email: regex }, { phone: regex }];
    }
    const skip = (page - 1) * limit;
    const [candidates, total] = await Promise.all([
        Candidate_js_1.default.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        Candidate_js_1.default.countDocuments(filter),
    ]);
    return {
        candidates,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
}
async function getCandidateById(id) {
    if (!mongoose_1.default.isValidObjectId(id)) {
        throw new errorHandler_js_1.AppError(400, "Invalid candidate ID");
    }
    const candidate = await Candidate_js_1.default.findById(id).lean();
    if (!candidate) {
        throw new errorHandler_js_1.AppError(404, "Candidate not found");
    }
    return candidate;
}
async function updateCandidate(id, input) {
    if (!mongoose_1.default.isValidObjectId(id)) {
        throw new errorHandler_js_1.AppError(400, "Invalid candidate ID");
    }
    const candidate = await Candidate_js_1.default.findByIdAndUpdate(id, { $set: input }, {
        new: true,
        runValidators: true,
    }).lean();
    if (!candidate) {
        throw new errorHandler_js_1.AppError(404, "Candidate not found");
    }
    return candidate;
}
async function deleteCandidate(id) {
    if (!mongoose_1.default.isValidObjectId(id)) {
        throw new errorHandler_js_1.AppError(400, "Invalid candidate ID");
    }
    const candidate = await Candidate_js_1.default.findByIdAndDelete(id);
    if (!candidate) {
        throw new errorHandler_js_1.AppError(404, "Candidate not found");
    }
}
