// This file should be the single place where the app creates/reuses the Prisma client.
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.ts";
import { env } from "../config/env.ts";


const connectionString = env.DATABASE_URL;

if (!connectionString) {
    throw new Error("CRITICAL: DATABASE_URL is not set");
}

const adapter = new PrismaPg({
    connectionString: connectionString,
});


export const prisma = new PrismaClient({
    adapter: adapter,
});