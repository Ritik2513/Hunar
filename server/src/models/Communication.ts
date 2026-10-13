import { Schema, model, type InferSchemaType } from "mongoose";

const communicationAttemptSchema = new Schema(
  {
    attemptNumber: {
      type: Number,
      required: true,
      min: 1,
    },
    status: {
      type: String,
      enum: ["started", "sent", "delivered", "failed"],
      required: true,
    },
    providerMessageId: {
      type: String,
      default: null,
    },
    startedAt: {
      type: Date,
      required: true,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    errorMessage: {
      type: String,
      default: null,
    },
  },
  { _id: false },
);

const communicationSchema = new Schema(
  {
    candidateId: {
      type: Schema.Types.ObjectId,
      ref: "Candidate",
      required: true,
      index: true,
    },
    channel: {
      type: String,
      enum: ["email", "sms"],
      required: true,
    },
    recipient: {
      type: String,
      required: true,
      trim: true,
    },
    subject: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "",
    },
    body: {
      type: String,
      required: true,
      trim: true,
      maxlength: 10000,
    },
    batchId: {
      type: String,
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: ["queued", "sending", "sent", "delivered", "failed"],
      default: "queued",
      required: true,
      index: true,
    },
    attempts: {
      type: [communicationAttemptSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

communicationSchema.index({ candidateId: 1, createdAt: -1 });
communicationSchema.index({ "attempts.providerMessageId": 1 });

export type CommunicationDocument = InferSchemaType<typeof communicationSchema>;

const Communication = model("Communication", communicationSchema);

export default Communication;
