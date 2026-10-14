import { Router } from "express";
import { providerCallbackController } from "../controllers/communicationController.js";

const router = Router();

router.post("/provider", providerCallbackController);

export default router;
