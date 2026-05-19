import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app.js";
import { prisma } from "../src/db/prisma.js";

type CreateLinkResponse = {
  short_url: string;
  short_code: string;
  long_url: string;
  expires_at: string;
};

type LinkStatsResponse = {
  long_url: string;
  short_url: string;
  short_code: string;
  expires_at: string;
  created_at: string;
  click_count: number;
};

function parseJson<T>(response: { body: string }): T {
  return JSON.parse(response.body) as T;
}

describe("links API", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = buildApp();
    await app.ready();
  });

  beforeEach(async () => {
    await prisma.link.deleteMany();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  async function createTestLink(
    longUrl = "https://example.com/articles/backend-design"
  ) {
    const response = await app.inject({
      method: "POST",
      url: "/api/links",
      payload: {
        long_url: longUrl,
      },
    });

    expect(response.statusCode).toBe(201);

    return parseJson<CreateLinkResponse>(response);
  }

  describe("POST /api/links", () => {
    it("creates a short link for a valid HTTP URL", async () => {
      const longUrl = "http://example.com";

      const response = await app.inject({
        method: "POST",
        url: "/api/links",
        payload: {
          long_url: longUrl,
        },
      });

      expect(response.statusCode).toBe(201);

      const body = parseJson<CreateLinkResponse>(response);

      expect(body.long_url).toBe(longUrl);
      expect(body.short_code).toEqual(expect.any(String));
      expect(body.short_code.length).toBeGreaterThan(0);
      expect(body.short_url).toBe(`http://localhost:3000/${body.short_code}`);
      expect(Number.isNaN(Date.parse(body.expires_at))).toBe(false);

      const dbLink = await prisma.link.findUnique({
        where: {
          shortCode: body.short_code,
        },
      });

      expect(dbLink).not.toBeNull();
      expect(dbLink?.longUrl).toBe(longUrl);
    });

    it("creates a short link for a valid HTTPS URL", async () => {
      const longUrl = "https://example.com/some/path";

      const response = await app.inject({
        method: "POST",
        url: "/api/links",
        payload: {
          long_url: longUrl,
        },
      });

      expect(response.statusCode).toBe(201);

      const body = parseJson<CreateLinkResponse>(response);

      expect(body.long_url).toBe(longUrl);
      expect(body.short_code).toEqual(expect.any(String));
      expect(body.short_url).toBe(`http://localhost:3000/${body.short_code}`);

      const count = await prisma.link.count();
      expect(count).toBe(1);
    });

    it("rejects a URL without http or https", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/links",
        payload: {
          long_url: "example.com",
        },
      });

      expect(response.statusCode).toBe(400);

      const count = await prisma.link.count();
      expect(count).toBe(0);
    });

    it("rejects a random string that is not a URL", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/links",
        payload: {
          long_url: "hello world",
        },
      });

      expect(response.statusCode).toBe(400);

      const count = await prisma.link.count();
      expect(count).toBe(0);
    });

    it("rejects an empty URL", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/links",
        payload: {
          long_url: "",
        },
      });

      expect(response.statusCode).toBe(400);

      const count = await prisma.link.count();
      expect(count).toBe(0);
    });

    it("rejects a missing long_url field", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/links",
        payload: {},
      });

      expect(response.statusCode).toBe(400);

      const count = await prisma.link.count();
      expect(count).toBe(0);
    });

    it("rejects the wrong field name", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/links",
        payload: {
          longUrl: "https://example.com",
        },
      });

      expect(response.statusCode).toBe(400);

      const count = await prisma.link.count();
      expect(count).toBe(0);
    });
  });

  describe("GET /api/links/:short_code", () => {
    it("returns stats for an existing short link", async () => {
      const created = await createTestLink("https://example.com/stats-test");

      const response = await app.inject({
        method: "GET",
        url: `/api/links/${created.short_code}`,
      });

      expect(response.statusCode).toBe(200);

      const body = parseJson<LinkStatsResponse>(response);

      expect(body.long_url).toBe("https://example.com/stats-test");
      expect(body.short_code).toBe(created.short_code);
      expect(body.short_url).toBe(`http://localhost:3000/${created.short_code}`);
      expect(body.click_count).toBe(0);
      expect(Number.isNaN(Date.parse(body.created_at))).toBe(false);
      expect(Number.isNaN(Date.parse(body.expires_at))).toBe(false);
    });

    it("returns 404 for a missing short code", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/api/links/Missing123",
      });

      expect(response.statusCode).toBe(404);
    });

    it("returns 400 for an invalid short code format", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/api/links/abc!!!",
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe("GET /:short_code", () => {
    it("redirects an existing valid short link", async () => {
      const longUrl = "https://example.com/redirect-target";
      const created = await createTestLink(longUrl);

      const response = await app.inject({
        method: "GET",
        url: `/${created.short_code}`,
      });

      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toBe(longUrl);
    });

    it("increments click_count after redirect", async () => {
      const created = await createTestLink("https://example.com/click-count");

      const redirectResponse = await app.inject({
        method: "GET",
        url: `/${created.short_code}`,
      });

      expect(redirectResponse.statusCode).toBe(302);

      const statsResponse = await app.inject({
        method: "GET",
        url: `/api/links/${created.short_code}`,
      });

      expect(statsResponse.statusCode).toBe(200);

      const stats = parseJson<LinkStatsResponse>(statsResponse);

      expect(stats.click_count).toBe(1);
    });

    it("returns 404 for a missing short code", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/Missing123",
      });

      expect(response.statusCode).toBe(404);
    });

    it("returns 400 for an invalid short code format", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/abc!!!",
      });

      expect(response.statusCode).toBe(400);
    });

    it("returns 410 for an expired link", async () => {
      await prisma.link.create({
        data: {
          longUrl: "https://example.com/expired",
          shortCode: "Expired1",
          expiresAt: new Date(Date.now() - 60_000),
        },
      });

      const response = await app.inject({
        method: "GET",
        url: "/Expired1",
      });

      expect(response.statusCode).toBe(410);
    });
  });
});