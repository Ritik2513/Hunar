"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const communicationController_js_1 = require("../controllers/communicationController.js");
const router = (0, express_1.Router)();
router.post("/provider", communicationController_js_1.providerCallbackController);
exports.default = router;
