import { env } from "../config/env.ts";
import Sqids from "sqids";

const alphabet = env.SQIDS_ALPHABET;

if (!alphabet || alphabet.length !== 62) {
  throw new Error("CRITICAL: SQIDS_ALPHABET environment variable is missing or invalid!");
}

const sqids = new Sqids({
    alphabet: alphabet,
    minLength: 6
})


export function generateShortCode(id: number): string {
    return sqids.encode([id]);
}

export function decodeShortcode(code: string): number {
  const numbers = sqids.decode(code);
  return numbers.length > 0 ? (numbers[0] as number) : -1;
}