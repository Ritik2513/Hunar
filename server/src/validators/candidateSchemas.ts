import { z } from "zod";

const candidateFields = {
  name: z.string().trim().min(2).max(100),
  email: z
    .string()
    .trim()
    .email()
    .max(254)
    .transform((value) => value.toLowerCase()),
  phone: z.string().trim().min(5).max(30),
  jobTitle: z.string().trim().max(100).optional(),
  notes: z.string().trim().max(2000).optional(),
};

export const createCandidateSchema = z.object({
  body: z.object(candidateFields).strict(),
});

export const updateCandidateSchema = z.object({
  body: z
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

export const listCandidatesSchema = z.object({
  query: z.object({
    search: z.string().trim().max(100).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
  }),
});

export type CreateCandidateInput = z.infer<
  typeof createCandidateSchema
>["body"];

export type UpdateCandidateInput = z.infer<
  typeof updateCandidateSchema
>["body"];
