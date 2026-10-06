ALTER TABLE "CtflSyllabusMonitor"
    ADD COLUMN "sampleExamLetter" TEXT,
    ADD COLUMN "sampleExamVersion" TEXT,
    ADD COLUMN "sampleExamAnswersVersion" TEXT,
    ADD COLUMN "sampleExamQuestionsPdfUrl" TEXT,
    ADD COLUMN "sampleExamAnswersPdfUrl" TEXT,
    ADD COLUMN "sampleQuestionsPdfSha256" TEXT,
    ADD COLUMN "sampleAnswersPdfSha256" TEXT;