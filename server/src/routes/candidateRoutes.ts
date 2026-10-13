import { Router } from "express";
import {
  createCandidate,
  deleteCandidate,
  getCandidate,
  listCandidates,
  updateCandidate,
} from "../controllers/candidateController.js";

const router = Router();
router.post("/", createCandidate);
router.get("/", listCandidates);
router.get("/:id", getCandidate);
router.patch("/:id", updateCandidate);
router.delete("/:id", deleteCandidate);

export default router;
