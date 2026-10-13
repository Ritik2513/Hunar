import { Schema, model, type InferSchemaType } from "mongoose";

const providerEventSchema = new Schema(
  {
    providerEventId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    providerMessageId: {
      type: String,
      required: true,
      index: true,
    },
    communicationId: {
      type: Schema.Types.ObjectId,
      ref: "Communication",
      required: true,
      index: true,
    },
    eventType: {
      type: String,
      enum: ["sent", "delivered", "failed"],
      required: true,
    },
    payload: {
      type: Schema.Types.Mixed,
      default: {},
    },
    receivedAt: {
      type: Date,
      default: Date.now,
    },
    processedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export type ProviderEventDocument = InferSchemaType<typeof providerEventSchema>;

const ProviderEvent = model("ProviderEvent", providerEventSchema);

export default ProviderEvent;
