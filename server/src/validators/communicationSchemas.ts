import { z } from "zod";

export const sendCommunicationSchema = z.object({
  body: z
    .object({
      candidateId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid candidate ID"),
      channel: z.enum(["email", "sms"]),
      subject: z.string().trim().max(200).optional(),
      body: z.string().trim().min(1).max(10000),
    })
    .strict(),
});

export const candidateCommunicationHistorySchema = z.object({
  params: z.object({
    candidateId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid candidate ID"),
  }),
});

export const providerCallbackSchema = z.object({
  eventId: z.string().uuid(),
  providerMessageId: z.string().min(1).max(200),
  communicationId: z.string().regex(/^[a-f\d]{24}$/i),
  attemptNumber: z.number().int().min(1),
  eventType: z.enum(["sent", "delivered", "failed"]),
  occurredAt: z.string().datetime({ offset: true }),
  errorMessage: z.string().max(1000).optional(),
});

export const bulkCommunicationSchema = z.object({
  body: z
    .object({
      candidateIds: z
        .array(z.string().regex(/^[a-f\d]{24}$/i, "Invalid candidate ID"))
        .min(1)
        .max(100)
        .refine(
          (ids) => new Set(ids).size === ids.length,
          "Duplicate candidate IDs are not allowed",
        ),
      channel: z.enum(["email", "sms"]),
      subject: z.string().trim().max(200).optional(),
      body: z.string().trim().min(1).max(10000),
    })
    .strict(),
});

export const retryCommunicationSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[a-f\d]{24}$/i, "Invalid communication ID"),
  }),
});

export type SendCommunicationInput = z.infer<
  typeof sendCommunicationSchema
>["body"];

export type ProviderCallbackInput = z.infer<typeof providerCallbackSchema>;

export type BulkCommunicationInput = z.infer<
  typeof bulkCommunicationSchema
>["body"];
