import { randomUUID, timingSafeEqual } from "node:crypto";
import mongoose from "mongoose";
import Candidate from "../models/Candidate.js";
import Communication from "../models/Communication.js";
import ProviderEvent from "../models/ProviderEvent.js";
import { AppError } from "../middleware/errorHandler.js";
import { env } from "../config/communicationEnv.js";
import type {
  ProviderCallbackInput,
  SendCommunicationInput,
} from "../validators/communicationSchemas.js";

interface ProviderResponse {
  success: boolean;
  data?: {
    providerMessageId: string;
    status: "accepted";
  };
  message?: string;
}

export async function sendCommunication(input: SendCommunicationInput) {
  if (!mongoose.isValidObjectId(input.candidateId)) {
    throw new AppError(400, "Invalid candidate ID");
  }

  const candidate = await Candidate.findById(input.candidateId).lean();

  if (!candidate) {
    throw new AppError(404, "Candidate not found");
  }

  const recipient =
    input.channel === "email" ? candidate.email : candidate.phone;

  const communication = await Communication.create({
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
    const response = await fetch(`${env.PROVIDER_URL}/api/provider/send`, {
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

    const result = (await response.json()) as ProviderResponse;

    if (!response.ok || !result.success || !result.data?.providerMessageId) {
      throw new Error(
        result.message ?? `Provider returned HTTP ${response.status}`,
      );
    }

    const providerMessageId = result.data.providerMessageId;

    communication.attempts[0]!.providerMessageId = providerMessageId;
    communication.attempts[0]!.status = "sent";
    communication.attempts[0]!.completedAt = new Date();
    communication.status = "sent";

    await communication.save();

    return communication.toObject();
  } catch (error) {
    communication.status = "failed";
    communication.attempts[0]!.status = "failed";
    communication.attempts[0]!.completedAt = new Date();
    communication.attempts[0]!.errorMessage =
      error instanceof Error ? error.message : "Unknown provider error";

    await communication.save();

    return {
      ...communication.toObject(),
      providerError: "The provider did not accept the message",
    };
  }
}

export async function listCandidateCommunications(candidateId: string) {
  if (!mongoose.isValidObjectId(candidateId)) {
    throw new AppError(400, "Invalid candidate ID");
  }

  const candidateExists = await Candidate.exists({ _id: candidateId });

  if (!candidateExists) {
    throw new AppError(404, "Candidate not found");
  }

  return Communication.find({ candidateId }).sort({ createdAt: -1 }).lean();
}

function hasValidSecret(receivedSecret: string | undefined): boolean {
  if (!receivedSecret) return false;

  const expected = Buffer.from(env.PROVIDER_CALLBACK_SECRET);
  const received = Buffer.from(receivedSecret);

  return (
    expected.length === received.length && timingSafeEqual(expected, received)
  );
}

export async function processProviderCallback(
  event: ProviderCallbackInput,
  receivedSecret: string | undefined,
) {
  if (!hasValidSecret(receivedSecret)) {
    throw new AppError(401, "Invalid provider callback secret");
  }

  let savedEvent;

  try {
    savedEvent = await ProviderEvent.create({
      providerEventId: event.eventId,
      providerMessageId: event.providerMessageId,
      communicationId: event.communicationId,
      eventType: event.eventType,
      payload: event,
    });
  } catch (error) {
    if (
      error instanceof mongoose.mongo.MongoServerError &&
      error.code === 11000
    ) {
      return { duplicate: true };
    }

    throw error;
  }

  try {
    const communication = await Communication.findById(event.communicationId);

    if (!communication) {
      throw new AppError(404, "Communication not found");
    }

    const attempt = communication.attempts.find(
      (item) => item.attemptNumber === event.attemptNumber,
    );

    if (!attempt || attempt.providerMessageId !== event.providerMessageId) {
      throw new AppError(409, "Provider message does not match an attempt");
    }

    // Delivery is terminal: delayed events cannot downgrade it.
    if (communication.status !== "delivered") {
      if (event.eventType === "delivered") {
        communication.status = "delivered";
        attempt.status = "delivered";
        attempt.errorMessage = null;
        attempt.completedAt = new Date(event.occurredAt);
      } else if (event.eventType === "failed") {
        // Ignore an older attempt's failure after a newer retry started.
        const latestAttemptNumber = Math.max(
          ...communication.attempts.map((item) => item.attemptNumber),
        );

        if (event.attemptNumber === latestAttemptNumber) {
          communication.status = "failed";
          attempt.status = "failed";
          attempt.errorMessage = event.errorMessage ?? "Delivery failed";
          attempt.completedAt = new Date(event.occurredAt);
        }
      } else if (
        communication.status !== "failed" &&
        event.attemptNumber === communication.attempts.length
      ) {
        communication.status = "sent";
        attempt.status = "sent";
        attempt.completedAt = new Date(event.occurredAt);
      }
    }

    await communication.save();

    savedEvent.processedAt = new Date();
    await savedEvent.save();

    return { duplicate: false };
  } catch (error) {
    if (!savedEvent.processedAt) {
      await ProviderEvent.deleteOne({ _id: savedEvent._id });
    }

    throw error;
  }
}
