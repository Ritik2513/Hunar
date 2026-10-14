import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4001),
  MAIN_API_URL: z.string().url(),
  PROVIDER_CALLBACK_SECRET: z.string().min(32),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("Invalid provider environment configuration:", parsedEnv.error.flatten());
  throw new Error("Provider configuration is invalid");
}

export const env = parsedEnv.data;
