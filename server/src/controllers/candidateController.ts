import type { RequestHandler } from "express";

import {
  createCandidateSchema,
  listCandidatesSchema,
  updateCandidateSchema,
} from "../validators/candidateSchemas.js";

import * as candidateService from "../services/candidateService.js";
import { AppError } from "../middleware/errorHandler.js";

/**
 * Validates that the candidate route parameter is a single string.
 */
function getCandidateId(id: string | string[] | undefined): string {
  if (typeof id !== "string") {
    throw new AppError(400, "Invalid candidate ID");
  }

  return id;
}

/**
 * POST /api/candidates
 * Create a candidate.
 */
export const createCandidate: RequestHandler = async (req, res, next) => {
  try {
    const { body } = createCandidateSchema.parse({
      body: req.body,
    });

    const candidate = await candidateService.createCandidate(body);

    res.status(201).json({
      success: true,
      data: candidate,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/candidates
 * List candidates with search and pagination.
 */
export const listCandidates: RequestHandler = async (req, res, next) => {
  try {
    const { query } = listCandidatesSchema.parse({
      query: req.query,
    });

    const result = await candidateService.listCandidates(query);

    res.status(200).json({
      success: true,
      data: result.candidates,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/candidates/:id
 * Retrieve one candidate by ID.
 */
export const getCandidate: RequestHandler = async (req, res, next) => {
  try {
    const id = getCandidateId(req.params.id);

    const candidate = await candidateService.getCandidateById(id);

    res.status(200).json({
      success: true,
      data: candidate,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/candidates/:id
 * Update an existing candidate.
 */
export const updateCandidate: RequestHandler = async (req, res, next) => {
  try {
    const id = getCandidateId(req.params.id);

    const { body } = updateCandidateSchema.parse({
      body: req.body,
    });

    const candidate = await candidateService.updateCandidate(id, body);

    res.status(200).json({
      success: true,
      data: candidate,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/candidates/:id
 * Delete an existing candidate.
 */
export const deleteCandidate: RequestHandler = async (req, res, next) => {
  try {
    const id = getCandidateId(req.params.id);

    await candidateService.deleteCandidate(id);

    res.status(204).end();
  } catch (error) {
    next(error);
  }
};
