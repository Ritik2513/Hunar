import { z } from "zod";

const schema = z.object({
  PROVIDER_URL: z.string().url(),
  PROVIDER_CALLBACK_SECRET: z.string().min(32),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  throw new Error(
    `Invalid communication configuration: ${JSON.stringify(parsed.error.flatten())}`,
  );
}

export const env = parsed.data;
