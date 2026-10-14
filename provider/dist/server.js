"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const env_js_1 = require("./config/env.js");
const app_js_1 = __importDefault(require("./app.js"));
const server = app_js_1.default.listen(env_js_1.env.PORT, () => {
    console.log(`Hunar provider running on port ${env_js_1.env.PORT}`);
});
function shutdown(signal) {
    console.log(`${signal} received. Shutting down provider...`);
    server.close((error) => {
        if (error) {
            console.error("Error while shutting down provider:", error);
            process.exitCode = 1;
        }
    });
}
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
