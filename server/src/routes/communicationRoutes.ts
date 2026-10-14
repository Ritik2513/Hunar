import { Router } from "express";
import {
  sendCommunicationController,
  candidateCommunicationHistoryController,
  bulkCommunicationController,
  retryCommunicationController,
} from "../controllers/communicationController.js";

const router = Router();

router.post("/send", sendCommunicationController);
router.get("/candidate/:candidateId", candidateCommunicationHistoryController);
router.post("/bulk", bulkCommunicationController);
router.post("/:id/retry", retryCommunicationController);

export default router;
