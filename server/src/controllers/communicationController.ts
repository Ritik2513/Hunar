import type { RequestHandler } from "express";
import {
  sendCommunicationSchema,
  candidateCommunicationHistorySchema,
  providerCallbackSchema,
  bulkCommunicationSchema,
  retryCommunicationSchema,
} from "../validators/communicationSchemas.js";
import {
  sendCommunication,
  listCandidateCommunications,
  processProviderCallback,
  sendBulkCommunication,
  retryCommunication,
} from "../services/communicationService.js";

export const sendCommunicationController: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const { body } = sendCommunicationSchema.parse({ body: req.body });
    const result = await sendCommunication(body);

    if ("providerError" in result) {
      res.status(502).json({
        success: false,
        message: result.providerError,
        data: result,
      });
      return;
    }

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const candidateCommunicationHistoryController: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const { params } = candidateCommunicationHistorySchema.parse({
      params: req.params,
    });

    const communications = await listCandidateCommunications(
      params.candidateId,
    );

    res.status(200).json({
      success: true,
      data: communications,
    });
  } catch (error) {
    next(error);
  }
};

export const providerCallbackController: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const event = providerCallbackSchema.parse({ ...req.body });

    const result = await processProviderCallback(
      event,
      req.header("x-provider-secret"),
    );

    res.status(200).json({
      success: true,
      message: result.duplicate
        ? "Duplicate provider event ignored"
        : "Provider event processed",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const bulkCommunicationController: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const { body } = bulkCommunicationSchema.parse({
      body: req.body,
    });

    const result = await sendBulkCommunication(body);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const retryCommunicationController: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const { params } = retryCommunicationSchema.parse({
      params: req.params,
    });

    const result = await retryCommunication(params.id);

    if ("providerError" in result) {
      res.status(502).json({
        success: false,
        message: result.providerError,
        data: result,
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
