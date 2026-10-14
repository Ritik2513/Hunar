import { Router, type RequestHandler } from "express";
import { z } from "zod";
import {
  ProviderOutageError,
  submitDelivery,
} from "../services/deliveryService";

const router = Router();

const sendMessageSchema = z
  .object({
    communicationId: z.string().regex(/^[a-f\d]{24}$/i),
    attemptNumber: z.number().int().min(1),
    channel: z.enum(["email", "sms"]),
    recipient: z.string().trim().min(1).max(254),
    subject: z.string().max(200).optional(),
    body: z.string().trim().min(1).max(10000),
    simulateOutcome: z.enum(["success", "failure", "outage"]).optional(),
  })
  .strict();

const sendMessageHandler: RequestHandler = async (req, res, next) => {
  try {
    const parsed = sendMessageSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: "Invalid provider request",
        errors: parsed.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
      return;
    }

    const result = await submitDelivery(parsed.data);

    res.status(202).json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof ProviderOutageError) {
      res.status(503).json({
        success: false,
        message: error.message,
      });
      return;
    }
    next(error);
  }
};

router.post("/send", sendMessageHandler);

export default router
