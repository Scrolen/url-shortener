import "dotenv/config";

export const env = {
    DATABASE_URL: process.env.DATABASE_URL,
    PORT: Number(process.env.PORT),
    BASE_URL: process.env.BASE_URL || "http://localhost:3000",
    DEFAULT_LINK_TTL_DAYS: Number(process.env.DEFAULT_LINK_TTL_DAYS),
    SQIDS_ALPHABET: process.env.SQIDS_ALPHABET,
}
