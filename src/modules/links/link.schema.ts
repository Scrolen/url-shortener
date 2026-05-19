import { z } from "zod";

export const createLinkBodySchema = z.object({
    long_url: z.string().trim().min(1, "url to shorten is required").pipe(z.httpUrl()),
});

export const shortCodeSchema = z
  .string()
  .trim()
  .min(1, "short code is required")
  .max(16, "short code is too long")
  .regex(/^[a-zA-Z0-9]+$/, "short code must be alphanumeric");

export const shortCodeParamsSchema = z.object({
  short_code: shortCodeSchema,
});


export type CreateLinkInput = z.infer<typeof createLinkBodySchema>;
export type ShortCode = z.infer<typeof shortCodeSchema>;