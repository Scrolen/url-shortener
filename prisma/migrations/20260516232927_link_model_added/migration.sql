-- CreateTable
CREATE TABLE "links" (
    "id" SERIAL NOT NULL,
    "long_url" TEXT NOT NULL,
    "short_code" VARCHAR(16) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "click_count" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "links_short_code_key" ON "links"("short_code");

-- CreateIndex
CREATE INDEX "links_expires_at_idx" ON "links"("expires_at");
