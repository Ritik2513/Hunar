export type DeliveryOutcome = "success" | "failure" | "outage";

export type ProviderEventType = "sent" | "delivered" | "failed";

export interface SendMessageInput {
  communicationId: string;
  attemptNumber: number;
  channel: "email" | "sms";
  recipient: string;
  subject?: string;
  body: string;
  simulateOutcome?: DeliveryOutcome;
}

export interface ProviderCallback {
  eventId: string;
  providerMessageId: string;
  communicationId: string;
  attemptNumber: number;
  eventType: ProviderEventType;
  occurredAt: string;
  errorMessage?: string;
}
