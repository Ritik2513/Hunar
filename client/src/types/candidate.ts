export interface Candidate {
  _id: string;
  name: string;
  email: string;
  phone: string;
  jobTitle?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type CommunicationStatus =
  | "sending"
  | "sent"
  | "delivered"
  | "read"
  | "failed";

export interface Communication {
  _id: string;
  candidateId: string;
  channel: "email" | "sms";
  body: string;
  status: CommunicationStatus;
  createdAt: string;
}
