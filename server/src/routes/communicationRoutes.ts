import { Router } from "express";
import {
  sendCommunicationController,
  candidateCommunicationHistoryController,
} from "../controllers/communicationController.js";

const router = Router();

router.post("/send", sendCommunicationController);
router.get("/candidate/:candidateId", candidateCommunicationHistoryController);

export default router;
