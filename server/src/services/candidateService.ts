import mongoose from "mongoose";
import Candidate from "../models/Candidate.js";
import { AppError } from "../middleware/errorHandler.js";
import type {
  CreateCandidateInput,
  UpdateCandidateInput,
} from "../validators/candidateSchemas.js";

interface ListCandidatesOptions {
  search?: string;
  page: number;
  limit: number;
}

interface CandidateSearchFilter {
  name?: RegExp;
  email?: RegExp;
  phone?: RegExp;
  $or?: CandidateSearchFilter[];
}

export async function createCandidate(input: CreateCandidateInput) {
  return Candidate.create(input);
}

export async function listCandidates(options: ListCandidatesOptions) {
  const { search, page, limit } = options;

  const filter: CandidateSearchFilter = {};

  if (search?.trim()) {
    const escapedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escapedSearch, "i");

    filter.$or = [{ name: regex }, { email: regex }, { phone: regex }];
  }

  const skip = (page - 1) * limit;

  const [candidates, total] = await Promise.all([
    Candidate.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Candidate.countDocuments(filter),
  ]);

  return {
    candidates,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getCandidateById(id: string) {
  if (!mongoose.isValidObjectId(id)) {
    throw new AppError(400, "Invalid candidate ID");
  }

  const candidate = await Candidate.findById(id).lean();

  if (!candidate) {
    throw new AppError(404, "Candidate not found");
  }

  return candidate;
}

export async function updateCandidate(id: string, input: UpdateCandidateInput) {
  if (!mongoose.isValidObjectId(id)) {
    throw new AppError(400, "Invalid candidate ID");
  }

  const candidate = await Candidate.findByIdAndUpdate(
    id,
    { $set: input },
    {
      new: true,
      runValidators: true,
    },
  ).lean();

  if (!candidate) {
    throw new AppError(404, "Candidate not found");
  }

  return candidate;
}

export async function deleteCandidate(id: string) {
  if (!mongoose.isValidObjectId(id)) {
    throw new AppError(400, "Invalid candidate ID");
  }

  const candidate = await Candidate.findByIdAndDelete(id);

  if (!candidate) {
    throw new AppError(404, "Candidate not found");
  }
}
