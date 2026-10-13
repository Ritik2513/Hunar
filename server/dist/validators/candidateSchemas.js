"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listCandidatesSchema = exports.updateCandidateSchema = exports.createCandidateSchema = void 0;
const zod_1 = require("zod");
const candidateFields = {
    name: zod_1.z.string().trim().min(2).max(100),
    email: zod_1.z
        .string()
        .trim()
        .email()
        .max(254)
        .transform((value) => value.toLowerCase()),
    phone: zod_1.z.string().trim().min(5).max(30),
    jobTitle: zod_1.z.string().trim().max(100).optional(),
    notes: zod_1.z.string().trim().max(2000).optional(),
};
exports.createCandidateSchema = zod_1.z.object({
    body: zod_1.z.object(candidateFields).strict(),
});
exports.updateCandidateSchema = zod_1.z.object({
    body: zod_1.z
        .object({
        name: candidateFields.name.optional(),
        email: candidateFields.email.optional(),
        phone: candidateFields.phone.optional(),
        jobTitle: candidateFields.jobTitle,
        notes: candidateFields.notes,
    })
        .strict()
        .refine((body) => Object.keys(body).length > 0, {
        message: "Provide at least one field to update",
    }),
});
exports.listCandidatesSchema = zod_1.z.object({
    query: zod_1.z.object({
        search: zod_1.z.string().trim().max(100).optional(),
        page: zod_1.z.coerce.number().int().min(1).default(1),
        limit: zod_1.z.coerce.number().int().min(1).max(100).default(10),
    }),
});
