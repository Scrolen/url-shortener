import { config } from "dotenv";

config({
  path: ".env.test",
  override: true,
});

process.env.NODE_ENV = "test";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set for tests");
}

if (!process.env.DATABASE_URL.includes("url_shortener_test")) {
  throw new Error(
    "Refusing to run tests because DATABASE_URL is not pointing to url_shortener_test"
  );
}