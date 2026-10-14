import { randomUUID } from "node:crypto";
import { env } from "../config/env.js";
import type {
  DeliveryOutcome,
  ProviderCallback,
  SendMessageInput,
} from "../types/provider.js";

export class ProviderOutageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProviderOutageError";
  }
}

async function sendCallback(event: ProviderCallback): Promise<void> {
  const response = await fetch(`${env.MAIN_API_URL}/api/webhooks/provider`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-provider-secret": env.PROVIDER_CALLBACK_SECRET,
    },
    body: JSON.stringify(event),
    signal: AbortSignal.timeout(5000),
  });

  if (!response.ok) {
    throw new Error(`Callback failed with HTTP ${response.status}`);
  }
}

function scheduleCallback(event: ProviderCallback, delayMs: number): void {
  setTimeout(() => {
    void sendCallback(event).catch((error: unknown) => {
      console.error(
        `Could not deliver provider event ${event.eventId}:`,
        error instanceof Error ? error.message : error,
      );
    });
  }, delayMs);
}

export async function submitDelivery(
  input: SendMessageInput,
): Promise<{ providerMessageId: string; status: "accepted" }> {
  const outcome: DeliveryOutcome = input.simulateOutcome ?? "success";

  if (outcome === "outage") {
    throw new ProviderOutageError("Simulated provider outage");
  }

  const providerMessageId = randomUUID();
  const baseEvent = {
    providerMessageId,
    communicationId: input.communicationId,
    attemptNumber: input.attemptNumber,
  };

  scheduleCallback(
    {
      ...baseEvent,
      eventId: randomUUID(),
      eventType: "sent",
      occurredAt: new Date().toISOString(),
    },
    500,
  );

  if (outcome === "success") {
    scheduleCallback(
      {
        ...baseEvent,
        eventId: randomUUID(),
        eventType: "delivered",
        occurredAt: new Date().toISOString(),
      },
      1500,
    );
  } else {
    scheduleCallback(
      {
        ...baseEvent,
        eventId: randomUUID(),
        eventType: "failed",
        occurredAt: new Date().toISOString(),
        errorMessage: "Simulated delivery failure",
      },
      1500,
    );
  }

  return { providerMessageId, status: "accepted" };
}
