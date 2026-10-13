"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCandidate = exports.updateCandidate = exports.getCandidate = exports.listCandidates = exports.createCandidate = void 0;
const candidateSchemas_js_1 = require("../validators/candidateSchemas.js");
const candidateService = __importStar(require("../services/candidateService.js"));
const errorHandler_js_1 = require("../middleware/errorHandler.js");
/**
 * Validates that the candidate route parameter is a single string.
 */
function getCandidateId(id) {
    if (typeof id !== "string") {
        throw new errorHandler_js_1.AppError(400, "Invalid candidate ID");
    }
    return id;
}
/**
 * POST /api/candidates
 * Create a candidate.
 */
const createCandidate = async (req, res, next) => {
    try {
        const { body } = candidateSchemas_js_1.createCandidateSchema.parse({
            body: req.body,
        });
        const candidate = await candidateService.createCandidate(body);
        res.status(201).json({
            success: true,
            data: candidate,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createCandidate = createCandidate;
/**
 * GET /api/candidates
 * List candidates with search and pagination.
 */
const listCandidates = async (req, res, next) => {
    try {
        const { query } = candidateSchemas_js_1.listCandidatesSchema.parse({
            query: req.query,
        });
        const result = await candidateService.listCandidates(query);
        res.status(200).json({
            success: true,
            data: result.candidates,
            pagination: result.pagination,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.listCandidates = listCandidates;
/**
 * GET /api/candidates/:id
 * Retrieve one candidate by ID.
 */
const getCandidate = async (req, res, next) => {
    try {
        const id = getCandidateId(req.params.id);
        const candidate = await candidateService.getCandidateById(id);
        res.status(200).json({
            success: true,
            data: candidate,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getCandidate = getCandidate;
/**
 * PATCH /api/candidates/:id
 * Update an existing candidate.
 */
const updateCandidate = async (req, res, next) => {
    try {
        const id = getCandidateId(req.params.id);
        const { body } = candidateSchemas_js_1.updateCandidateSchema.parse({
            body: req.body,
        });
        const candidate = await candidateService.updateCandidate(id, body);
        res.status(200).json({
            success: true,
            data: candidate,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateCandidate = updateCandidate;
/**
 * DELETE /api/candidates/:id
 * Delete an existing candidate.
 */
const deleteCandidate = async (req, res, next) => {
    try {
        const id = getCandidateId(req.params.id);
        await candidateService.deleteCandidate(id);
        res.status(204).end();
    }
    catch (error) {
        next(error);
    }
};
exports.deleteCandidate = deleteCandidate;
