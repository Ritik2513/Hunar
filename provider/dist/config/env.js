"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
require("dotenv/config");
const zod_1 = require("zod");
const envSchema = zod_1.z.object({
    PORT: zod_1.z.coerce.number().int().positive().default(4001),
    MAIN_API_URL: zod_1.z.string().url(),
    PROVIDER_CALLBACK_SECRET: zod_1.z.string().min(32),
});
const parsedEnv = envSchema.safeParse(process.env);
if (!parsedEnv.success) {
    console.error("Invalid provider environment configuration:", parsedEnv.error.flatten());
    throw new Error("Provider configuration is invalid");
}
exports.env = parsedEnv.data;
