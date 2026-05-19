import { buildApp } from "./app.ts"
import { env } from "./config/env.ts";

const app = buildApp();

const port = env.PORT;

try {
    await app.listen({
        port,
        host: "0.0.0.0",
    });
} catch (err) {
    app.log.error(err);
    process.exit(1);
}