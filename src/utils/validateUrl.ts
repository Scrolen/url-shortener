import { z } from "zod";


// const urlSchema = z.url({ protocol: /^https?:$/ });
const urlSchema = z.httpUrl();

export function validateUrl(url: string): boolean {
    const result = urlSchema.safeParse(url);
    return result.success;

}