"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const zod_1 = require("zod");
const schema = zod_1.z.object({
    PROVIDER_URL: zod_1.z.string().url(),
    PROVIDER_CALLBACK_SECRET: zod_1.z.string().min(32),
});
const parsed = schema.safeParse(process.env);
if (!parsed.success) {
    throw new Error(`Invalid communication configuration: ${JSON.stringify(parsed.error.flatten())}`);
}
exports.env = parsed.data;
