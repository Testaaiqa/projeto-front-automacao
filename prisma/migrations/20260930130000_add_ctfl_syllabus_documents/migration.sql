CREATE TABLE "CtflSyllabusDocument" (
    "id" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "officialVersion" TEXT NOT NULL,
    "pdfUrl" TEXT NOT NULL,
    "pdfSha256" TEXT NOT NULL,
    "content" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CtflSyllabusDocument_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CtflSyllabusDocument_pdfSha256_key" ON "CtflSyllabusDocument"("pdfSha256");
CREATE INDEX "CtflSyllabusDocument_lastSeenAt_idx" ON "CtflSyllabusDocument"("lastSeenAt");