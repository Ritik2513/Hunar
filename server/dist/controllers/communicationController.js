"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.providerCallbackController = exports.candidateCommunicationHistoryController = exports.sendCommunicationController = void 0;
const communicationSchemas_js_1 = require("../validators/communicationSchemas.js");
const communicationService_js_1 = require("../services/communicationService.js");
const sendCommunicationController = async (req, res, next) => {
    try {
        const { body } = communicationSchemas_js_1.sendCommunicationSchema.parse({ body: req.body });
        const result = await (0, communicationService_js_1.sendCommunication)(body);
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
    }
    catch (error) {
        next(error);
    }
};
exports.sendCommunicationController = sendCommunicationController;
const candidateCommunicationHistoryController = async (req, res, next) => {
    try {
        const { params } = communicationSchemas_js_1.candidateCommunicationHistorySchema.parse({
            params: req.params,
        });
        const communications = await (0, communicationService_js_1.listCandidateCommunications)(params.candidateId);
        res.status(200).json({
            success: true,
            data: communications,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.candidateCommunicationHistoryController = candidateCommunicationHistoryController;
const providerCallbackController = async (req, res, next) => {
    try {
        const event = communicationSchemas_js_1.providerCallbackSchema.parse({ ...req.body });
        const result = await (0, communicationService_js_1.processProviderCallback)(event, req.header("x-provider-secret"));
        res.status(200).json({
            success: true,
            message: result.duplicate
                ? "Duplicate provider event ignored"
                : "Provider event processed",
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.providerCallbackController = providerCallbackController;
