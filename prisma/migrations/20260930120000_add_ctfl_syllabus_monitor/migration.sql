CREATE TABLE "CtflSyllabusMonitor" (
    "id" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "officialVersion" TEXT,
    "pdfUrl" TEXT,
    "pdfSha256" TEXT,
    "lastCheckedAt" TIMESTAMP(3),
    "lastChangedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CtflSyllabusMonitor_pkey" PRIMARY KEY ("id")
);