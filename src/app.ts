import Fastify from "fastify";
import { linkRoutes } from "./modules/links/link.routes.ts";

export function buildApp() {
    const app = Fastify({
        logger: true,
    });

    app.get("/health", async () => {
        return { status: "ok" };
    });

    app.register(linkRoutes)

    return app
}