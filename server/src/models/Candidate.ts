import { Schema, model, type InferSchemaType } from "mongoose";

const candidateSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minLength: 2,
      maxLength: 100,
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxLength: 254,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
      maxLength: 30,
    },

    jobTitle: {
      type: String,
      trim: true,
      maxLength: 100,
      default: "",
    },

    notes: {
      type: String,
      trim: true,
      maxLength: 2000,
      default: "",
    },
  },
  { timestamps: true, versionKey: false },
);

candidateSchema.index({ email: 1 }, { unique: true });
candidateSchema.index({ name: 1 });

export type CandidateDocument = InferSchemaType<typeof candidateSchema>;

const Candidate = model("Candidate", candidateSchema);

export default Candidate;
