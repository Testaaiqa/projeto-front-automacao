import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';
import {
  buildCtflSyllabusStatus,
  checkOfficialCtflSyllabus,
  CTFL_QUESTION_BANK_PDF_SHA256,
  CTFL_QUESTION_BANK_SAMPLE_SHA256,
  extractOfficialSyllabus,
  extractOfficialSampleExam,
  isAuthorizedCronRequest,
  readCtflSyllabusDocument,
  readCtflSyllabusStatus,
  storeCtflSyllabusDocument,
} from './ctflSyllabus.js';

const officialPage = [
  '<a href="https://www.bstqb.qa/files/syllabus_ctfl_4.0br.pdf">CTFL Syllabus v4.0</a>',
  '<a href="https://www.bstqb.qa/files/ISTQB_CTFL_v4.0_Sample-Exam-A-Questions_v1.7BR.pdf">CTFL v4.0 Sample Exam A Questions v1.7</a>',
  '<a href="https://www.bstqb.qa/files/ISTQB_CTFL_v4.0_Sample-Exam-A-Answers_v1.7BR.pdf">CTFL v4.0 Sample Exam A Answers v1.7</a>',
  '<a href="https://www.bstqb.qa/files/ISTQB_CTFL_v4.0_Sample-Exam-B-Questions_v1.7BR.pdf">CTFL v4.0 Sample Exam B Questions v1.7</a>',
  '<a href="https://www.bstqb.qa/files/ISTQB_CTFL_v4.0_Sample-Exam-B-Answers_v1.7BR.pdf">CTFL v4.0 Sample Exam B Answers v1.7</a>',
  '<a href="https://www.bstqb.qa/?sdm_process_download=1&amp;#038;download_id=3369">ISTQB CTFL v4.0 Sample Exam C- Questions v1.6</a>',
  '<a href="https://www.bstqb.qa/?sdm_process_download=1&amp;#038;download_id=3372">ISTQB CTFL v4.0 Sample Exam C- Answers v1.6</a>',
].join('');

function createPrismaMock(initialMonitorRecord = null) {
  let monitorRecord = initialMonitorRecord;
  const documents = [];
  let nextId = 1;

  function sortedDocuments() {
    return [...documents].sort((left, right) => (
      right.lastSeenAt.getTime() - left.lastSeenAt.getTime() || left.id.localeCompare(right.id)
    ));
  }

  const transaction = {
    $queryRaw: async () => [],
    ctflSyllabusDocument: {
      findUnique: async ({ where }) => documents.find((document) => document.pdfSha256 === where.pdfSha256) || null,
      create: async ({ data }) => {
        const document = { id: `document-${nextId++}`, createdAt: new Date(), ...data };
        documents.push(document);
        return document;
      },
      update: async ({ where, data }) => {
        const document = documents.find((item) => item.pdfSha256 === where.pdfSha256);
        Object.assign(document, data);
        return document;
      },
      findMany: async ({ skip = 0, take, select }) => sortedDocuments()
        .slice(skip, take === undefined ? undefined : skip + take)
        .map((document) => Object.fromEntries(Object.keys(select || document).map((key) => [key, document[key]]))),
      deleteMany: async ({ where }) => {
        const ids = new Set(where.id.in);
        const before = documents.length;
        for (let index = documents.length - 1; index >= 0; index -= 1) {
          if (ids.has(documents[index].id)) documents.splice(index, 1);
        }
        return { count: before - documents.length };
      },
    },
  };

  return {
    documents,
    monitor: () => monitorRecord,
    client: {
      $transaction: async (callback) => callback(transaction),
      ctflSyllabusDocument: transaction.ctflSyllabusDocument,
      ctflSyllabusMonitor: {
        findUnique: async () => monitorRecord,
        upsert: async ({ create, update }) => {
          monitorRecord = monitorRecord ? { ...monitorRecord, ...update } : create;
          return monitorRecord;
        },
      },
    },
  };
}

test('extracts the current syllabus version and official PDF URL', () => {
  assert.deepEqual(extractOfficialSyllabus(officialPage), {
    version: '4.0',
    pdfUrl: 'https://www.bstqb.qa/files/syllabus_ctfl_4.0br.pdf',
  });
});

test('extracts the latest complete official sample exam questions and answers pair', () => {
  assert.deepEqual(extractOfficialSampleExam(officialPage), {
    syllabusVersion: '4.0',
    examLetter: 'A',
    version: '1.7',
    questionsPdfUrl: 'https://www.bstqb.qa/files/ISTQB_CTFL_v4.0_Sample-Exam-A-Questions_v1.7BR.pdf',
    answersPdfUrl: 'https://www.bstqb.qa/files/ISTQB_CTFL_v4.0_Sample-Exam-A-Answers_v1.7BR.pdf',
  });
});

test('rejects syllabus links outside the official ISTQB domain', () => {
  const unsafePage = '<a href="https://example.com/syllabus.pdf">ISTQB CTFL Syllabus v4.0</a>';
  assert.throws(() => extractOfficialSyllabus(unsafePage), /domínio oficial/);
});

test('flags a question bank version that differs from the official syllabus', () => {
  const status = buildCtflSyllabusStatus({
    officialVersion: '4.1',
    lastCheckedAt: new Date('2026-09-30T00:00:00.000Z'),
  });

  assert.equal(status.status, 'review-required');
  assert.equal(status.versionMatches, false);
  assert.equal(status.pdfHashMatches, false);
  assert.equal(status.questionBankVersion, '4.0');
});

test('requires an explicitly reviewed PDF hash before reporting the bank as aligned', () => {
  const pdfSha256 = 'a'.repeat(64);
  const record = {
    officialVersion: '4.0',
    pdfSha256,
    sampleExamVersion: '1.7',
    sampleQuestionsPdfSha256: 'b'.repeat(64),
    lastCheckedAt: new Date('2026-09-30T00:00:00.000Z'),
  };

  assert.equal(CTFL_QUESTION_BANK_PDF_SHA256, null);
  assert.equal(CTFL_QUESTION_BANK_SAMPLE_SHA256, null);
  assert.equal(buildCtflSyllabusStatus(record).status, 'review-required');

  const reviewedStatus = buildCtflSyllabusStatus(record, {
    questionBankVersion: '4.0',
    questionBankPdfSha256: pdfSha256,
    questionBankSampleVersion: '1.7',
    questionBankSampleSha256: 'b'.repeat(64),
  });
  assert.equal(reviewedStatus.status, 'version-match');
  assert.equal(reviewedStatus.pdfHashMatches, true);
  assert.equal(reviewedStatus.sampleExamPdfHashMatches, true);
});

test('downloads, hashes, and records a changed official PDF', async () => {
  const pdfBytes = Buffer.from('%PDF-1.4\nsyllabus fixture');
  const previousRecord = {
    officialVersion: '4.0',
    pdfUrl: 'https://www.bstqb.qa/?download_id=old',
    pdfSha256: 'previous-hash',
    lastChangedAt: null,
  };
  const { client: prismaClient, documents, monitor } = createPrismaMock(previousRecord);
  let fetchCount = 0;
  const fetchImpl = async () => {
    fetchCount += 1;
    if (fetchCount === 1) return new Response(officialPage, { status: 200 });
    return new Response(pdfBytes, {
      status: 200,
      headers: { 'content-type': 'application/pdf' },
    });
  };

  const result = await checkOfficialCtflSyllabus({ fetchImpl, prismaClient });

  assert.equal(result.success, true);
  assert.equal(result.documentChanged, true);
  assert.equal(result.officialVersion, '4.0');
  assert.equal(result.sampleExamVersion, '1.7');
  assert.equal(result.sampleExamAnswersVersion, '1.7');
  assert.equal(result.pdfSha256, createHash('sha256').update(pdfBytes).digest('hex'));
  assert.equal(result.sampleQuestionsPdfSha256, createHash('sha256').update(pdfBytes).digest('hex'));
  assert.equal(result.sampleAnswersPdfSha256, createHash('sha256').update(pdfBytes).digest('hex'));
  assert.equal(monitor().officialVersion, '4.0');
  assert.equal(monitor().sampleExamLetter, 'A');
  assert.ok(monitor().lastChangedAt instanceof Date);
  assert.equal(documents.length, 1);
  assert.deepEqual(documents[0].content, pdfBytes);
});

test('stores the initial official PDF without requiring an existing monitor row', async () => {
  const pdfBytes = Buffer.from('%PDF-1.4\ninitial syllabus fixture');
  const { client: prismaClient, documents } = createPrismaMock();
  let fetchCount = 0;
  const fetchImpl = async () => {
    fetchCount += 1;
    return fetchCount === 1
      ? new Response(officialPage, { status: 200 })
      : new Response(pdfBytes, { status: 200 });
  };

  const result = await checkOfficialCtflSyllabus({ fetchImpl, prismaClient });

  assert.equal(result.success, true);
  assert.equal(result.status, 'review-required');
  assert.equal(documents.length, 1);
  assert.equal(documents[0].officialVersion, '4.0');
  assert.equal(documents[0].content.toString(), pdfBytes.toString());
});

test('retains only the two most recently checked official PDFs', async () => {
  const { client: prismaClient, documents } = createPrismaMock();

  for (let version = 1; version <= 3; version += 1) {
    const pdfBytes = Buffer.from(`%PDF-1.4\nversion ${version}`);
    await storeCtflSyllabusDocument({
      pdfBytes,
      officialVersion: `4.0.${version}`,
      pdfUrl: `https://www.bstqb.qa/syllabus-${version}.pdf`,
      pdfSha256: createHash('sha256').update(pdfBytes).digest('hex'),
      prismaClient,
      checkedAt: new Date(`2026-09-30T00:00:0${version}.000Z`),
    });
  }

  const retained = [...documents].sort((left, right) => right.lastSeenAt - left.lastSeenAt);
  assert.equal(documents.length, 2);
  assert.deepEqual(retained.map(({ officialVersion }) => officialVersion), ['4.0.3', '4.1']);
});

test('does not duplicate a PDF that has already been saved', async () => {
  const { client: prismaClient, documents } = createPrismaMock();
  const pdfBytes = Buffer.from('%PDF-1.4\nrepeat');
  const pdfSha256 = createHash('sha256').update(pdfBytes).digest('hex');
  const params = {
    pdfBytes,
    officialVersion: '4.0',
    pdfUrl: 'https://www.bstqb.qa/syllabus.pdf',
    pdfSha256,
    prismaClient,
  };

  await storeCtflSyllabusDocument({ ...params, checkedAt: new Date('2026-09-30T00:00:00.000Z') });
  await storeCtflSyllabusDocument({ ...params, checkedAt: new Date('2026-09-30T00:00:01.000Z') });

  assert.equal(documents.length, 1);
  assert.equal(documents[0].lastSeenAt.toISOString(), '2026-09-30T00:00:01.000Z');
});

test('returns only metadata in status and serves saved PDF bytes by hash', async () => {
  const { client: prismaClient } = createPrismaMock();
  const pdfBytes = Buffer.from('%PDF-1.4\nretained document');
  const pdfSha256 = createHash('sha256').update(pdfBytes).digest('hex');
  await storeCtflSyllabusDocument({
    pdfBytes,
    officialVersion: '4.0',
    pdfUrl: 'https://www.bstqb.qa/syllabus.pdf',
    pdfSha256,
    prismaClient,
  });

  const status = await readCtflSyllabusStatus(prismaClient);
  const document = await readCtflSyllabusDocument(pdfSha256, prismaClient);

  assert.equal(status.documents.length, 1);
  assert.equal(status.documents[0].pdfSha256, pdfSha256);
  assert.equal('content' in status.documents[0], false);
  assert.deepEqual(document.content, pdfBytes);
});

test('authorizes cron calls only with the configured bearer secret', () => {
  assert.equal(isAuthorizedCronRequest({ headers: { authorization: 'Bearer cron-secret' } }, 'cron-secret'), true);
  assert.equal(isAuthorizedCronRequest({ headers: { authorization: 'Bearer wrong' } }, 'cron-secret'), false);
  assert.equal(isAuthorizedCronRequest({ headers: {} }, ''), false);
});