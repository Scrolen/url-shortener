import "dotenv/config";
import z from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  PORT: z.coerce
    .number()
    .int()
    .positive()
    .default(3000),

  BASE_URL: z
    .string()
    .url("BASE_URL must be a valid URL")
    .default("http://localhost:3000"),

  DEFAULT_LINK_TTL_DAYS: z.coerce
    .number()
    .int()
    .positive()
    .default(7),

  SQIDS_ALPHABET: z
    .string()
    .min(10, "SQIDS_ALPHABET must contain enough characters"),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("Invalid environment variables:");
  console.error(z.treeifyError(parsedEnv.error));
  
  process.exit(1);
}

export const env = {
    DATABASE_URL: parsedEnv.data.DATABASE_URL,
    PORT: parsedEnv.data.PORT,
    BASE_URL: parsedEnv.data.BASE_URL,
    DEFAULT_LINK_TTL_DAYS: parsedEnv.data.DEFAULT_LINK_TTL_DAYS,
    SQIDS_ALPHABET: parsedEnv.data.SQIDS_ALPHABET,
}

// Backend pattern I learn: Only this file reads from process.env, and the rest of the codebase imports from this file.