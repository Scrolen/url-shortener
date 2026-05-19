import { FastifyInstance } from "fastify";
import { createLinkBodySchema, ShortCode, shortCodeParamsSchema, shortCodeSchema } from "./link.schema.ts";
import { error } from "node:console";
import z from "zod";
import { createLinkService, getLinkDataService, linkRedirectService } from "./link.service.ts";
import { request } from "node:http";
import { ca } from "zod/locales";



export async function linkRoutes(app: FastifyInstance) {
    app.post("/api/links", async (request, reply) => {
        const parsedBody = createLinkBodySchema.safeParse(request.body);

        if (!parsedBody.success) {
            return reply.status(400).send({
                error: "Invalid Request Body",
                detailss: z.treeifyError(parsedBody.error),
            });
        }

        try {
            const createdLink = await createLinkService(parsedBody.data);

            return reply.status(201).send(createdLink);
        } catch (error) {
            request.log.error(error);
            
            return reply.status(500).send({
                error: "Internal server error",
            });
        }
    });

    app.get("/api/links/:short_code",async(request, reply) => {

        const parsedParams = shortCodeParamsSchema.safeParse(request.params);

        if (!parsedParams.success) {
            return reply.status(400).send({
                error: "Invalid route params",
                details: z.treeifyError(parsedParams.error),
            });
        }

        try {
            const link = await getLinkDataService(parsedParams.data.short_code);

            if (!link) {
                return reply.status(404).send({
                    error: "Link not found",
                });
            }

            return reply.status(200).send(link);

        } catch (error) {
            request.log.error(error);
            
            return reply.status(500).send({
                error: "Internal server error",
            });
        }
    });

    app.get("/:short_code", async (request, reply) => {
        const parsedParams = shortCodeParamsSchema.safeParse(request.params);

        if (!parsedParams.success) {
            return reply.status(400).send({
                error: "Invalid route params",
                details: z.treeifyError(parsedParams.error),
            });
        }
        
        try {
            const result = await linkRedirectService(parsedParams.data.short_code);
            
            if(result.status === "not_found") {
                return reply.status(404).send({
                    error: "Link not found",
                });
            }

            if(result.status === "expired") {
                return reply.status(410).send({
                    error: "Link has expired",
                });
            }

            return reply.status(302).redirect(result.url);

        }catch (error) {
            request.log.error(error);
            
            return reply.status(500).send({
                error: "Internal server error",
            });
        }

    });
}