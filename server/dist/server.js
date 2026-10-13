"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const app_js_1 = __importDefault(require("./app.js"));
const database_js_1 = require("./config/database.js");
const PORT = Number(process.env.PORT) || 4000;
async function startServer() {
    try {
        await (0, database_js_1.connectDatabase)();
        app_js_1.default.listen(PORT, () => {
            console.log(`Hunar API is running on port ${PORT}`);
        });
    }
    catch (error) {
        console.error("Failed to start Hunar API:", error);
        process.exit(1);
    }
}
void startServer();
