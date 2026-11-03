import { createHash, timingSafeEqual } from 'node:crypto';
import questionBank from '../src/data/ctfl-question-bank.json' with { type: 'json' };

export const CTFL_SYLLABUS_SOURCE_URL = questionBank.sourceSyllabusUrl;
export const CTFL_QUESTION_BANK_VERSION = process.env.CTFL_QUESTION_BANK_VERSION?.trim() || questionBank.sourceSyllabusVersion;
const configuredQuestionBankPdfSha256 = process.env.CTFL_QUESTION_BANK_PDF_SHA256?.trim().toLowerCase() || '';
export const CTFL_QUESTION_BANK_PDF_SHA256 = /^[a-f\d]{64}$/.test(configuredQuestionBankPdfSha256)
  ? configuredQuestionBankPdfSha256
  : null;
export const CTFL_QUESTION_BANK_SAMPLE_VERSION = process.env.CTFL_QUESTION_BANK_SAMPLE_VERSION?.trim() || questionBank.sourceSampleExamSets[0]?.version || '1.7';
export const CTFL_QUESTION_BANK_SAMPLE_SET_VERSIONS = Object.fromEntries(questionBank.sourceSampleExamSets.map(({ examLetter, version }) => [examLetter, version]));
function parseEnvironmentJson(value) {
  try { return JSON.parse(value || '{}'); } catch { return {}; }
}
const configuredSampleSetVersions = parseEnvironmentJson(process.env.CTFL_QUESTION_BANK_SAMPLE_SET_VERSIONS);
const configuredSampleSetHashes = parseEnvironmentJson(process.env.CTFL_QUESTION_BANK_SAMPLE_SHA256S);
const sampleSetHashes = Object.fromEntries(Object.entries(configuredSampleSetHashes).map(([key, value]) => [
  key.toUpperCase(), {
    questions: /^[a-f\d]{64}$/i.test(value?.questions || '') ? value.questions.toLowerCase() : null,
    answers: /^[a-f\d]{64}$/i.test(value?.answers || '') ? value.answers.toLowerCase() : null,
  },
]));
const configuredQuestionBankSampleSha256 = process.env.CTFL_QUESTION_BANK_SAMPLE_SHA256?.trim().toLowerCase() || '';
export const CTFL_QUESTION_BANK_SAMPLE_SHA256 = /^[a-f\d]{64}$/.test(configuredQuestionBankSampleSha256)
  ? configuredQuestionBankSampleSha256
  : null;

const MONITOR_ID = 'ctfl';
const MAX_PDF_BYTES = 20 * 1024 * 1024;
const MAX_RETAINED_PDFS = 2;
const PDF_RETENTION_LOCK_ID = 71870401;
const ALLOWED_SOURCE_HOSTS = new Set(['bstqb.qa', 'www.bstqb.qa']);
function createRequestOptions() {
  return {
    headers: { 'User-Agent': 'TestaAiCTFLSyllabusMonitor/1.0' },
    signal: AbortSignal.timeout(20000),
  };
}

function decodeHtml(value) {
  return value
    .replace(/&amp;/gi, '&')
    .replace(/&#0*38;/gi, '&')
    .replace(/&nbsp;/gi, ' ');
}

function getAllowedPdfUrl(href, baseUrl) {
  const pdfUrl = new URL(decodeHtml(href), baseUrl);
  if (pdfUrl.protocol !== 'https:' || !ALLOWED_SOURCE_HOSTS.has(pdfUrl.hostname)) {
    throw new Error('O link do material não pertence ao domínio oficial do BSTQB.');
  }
  return pdfUrl.toString();
}

function compareVersions(leftVersion, rightVersion) {
  const leftParts = leftVersion.split('.').map(Number);
  const rightParts = rightVersion.split('.').map(Number);
  const partCount = Math.max(leftParts.length, rightParts.length);

  for (let index = 0; index < partCount; index += 1) {
    const difference = (leftParts[index] || 0) - (rightParts[index] || 0);
    if (difference !== 0) return difference;
  }

  return 0;
}

export function extractOfficialSyllabus(html, sourceUrl = CTFL_SYLLABUS_SOURCE_URL) {
  const anchors = html.match(/<a\b[^>]*>[\s\S]*?<\/a>/gi) || [];
  for (const anchor of anchors) {
    const text = anchor.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const syllabusMatch = text.match(/(?:ISTQB\s+)?CTFL\s+Syllabus\s+v?(\d+(?:\.\d+)+)/i);
    if (!syllabusMatch) continue;
    const hrefMatch = anchor.match(/\bhref=["']([^"']+)["']/i);
    if (!hrefMatch) continue;
    return { version: syllabusMatch[1], pdfUrl: getAllowedPdfUrl(hrefMatch[1], sourceUrl) };
  }
  throw new Error('Não foi possível localizar o PDF do syllabus CTFL na página oficial do BSTQB.');
}

export function extractOfficialSampleExams(html, sourceUrl = CTFL_SYLLABUS_SOURCE_URL) {
  const anchors = html.match(/<a\b[^>]*>[\s\S]*?<\/a>/gi) || [];
  const samples = new Map();
  for (const anchor of anchors) {
    const hrefMatch = anchor.match(/\bhref=["']([^"']+)["']/i);
    if (!hrefMatch) continue;
    const text = anchor.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const sampleReference = text + ' ' + hrefMatch[1];
    const match = sampleReference.match(/(?:Sample[-_\s]?Exam[-_\s]?([A-Z])|Set[-_\s]?([A-Z])).*?v(\d+(?:\.\d+)+)/i);
    const typeMatch = sampleReference.match(/(Questions|Perguntas|Answers|Respostas)/i);
    if (!match || !typeMatch) continue;
    const examLetter = (match[1] || match[2]).toUpperCase();
    const version = match[3];
    const documentType = /^(Questions|Perguntas)$/i.test(typeMatch[1]) ? 'questions' : 'answers';
    const key = examLetter + '-' + version;
    const sample = samples.get(key) || {
      syllabusVersion: questionBank.sourceSyllabusVersion,
      examLetter,
      version,
      questionsPdfUrl: null,
      answersPdfUrl: null,
    };
    const pdfUrl = getAllowedPdfUrl(hrefMatch[1], sourceUrl);
    if (documentType === 'questions') sample.questionsPdfUrl = pdfUrl;
    else sample.answersPdfUrl = pdfUrl;
    samples.set(key, sample);
  }
  const completeSamples = [...samples.values()]
    .filter((sample) => sample.questionsPdfUrl && sample.answersPdfUrl)
    .sort((left, right) => compareVersions(right.version, left.version) || left.examLetter.localeCompare(right.examLetter));
  if (completeSamples.length === 0) {
    throw new Error('Não foi possível localizar os PDFs oficiais de perguntas e respostas CTFL do BSTQB.');
  }
  return completeSamples;
}

export function extractOfficialSampleExam(html, sourceUrl = CTFL_SYLLABUS_SOURCE_URL) {
  return extractOfficialSampleExams(html, sourceUrl)[0];
}

async function downloadOfficialPdf(fetchImpl, pdfUrl, label) {
  const response = await fetchImpl(pdfUrl, createRequestOptions());
  if (!response.ok) {
    throw new Error(`O PDF oficial de ${label} respondeu com HTTP ${response.status}.`);
  }

  const resolvedUrl = response.url || pdfUrl;
  const resolvedHost = new URL(resolvedUrl).hostname;
  if (!ALLOWED_SOURCE_HOSTS.has(resolvedHost)) {
    throw new Error(`O PDF oficial de ${label} foi redirecionado para um domínio não autorizado.`);
  }

  const declaredSize = Number(response.headers.get('content-length') || 0);
  if (declaredSize > MAX_PDF_BYTES) {
    throw new Error(`O PDF oficial de ${label} excedeu o tamanho máximo de verificação.`);
  }

  const pdfBytes = Buffer.from(await response.arrayBuffer());
  if (pdfBytes.length > MAX_PDF_BYTES || pdfBytes.subarray(0, 5).toString() !== '%PDF-') {
    throw new Error(`A resposta oficial de ${label} não contém um PDF válido.`);
  }

  return {
    pdfUrl,
    pdfSha256: createHash('sha256').update(pdfBytes).digest('hex'),
    pdfBytes,
  };
}

export function buildCtflSyllabusStatus(record, {
  questionBankVersion = CTFL_QUESTION_BANK_VERSION,
  questionBankPdfSha256 = CTFL_QUESTION_BANK_PDF_SHA256,
  questionBankSampleVersion = CTFL_QUESTION_BANK_SAMPLE_VERSION,
  questionBankSampleSha256 = CTFL_QUESTION_BANK_SAMPLE_SHA256,
} = {}, documents = []) {
  const officialVersion = record?.officialVersion || null;
  const versionMatches = officialVersion === questionBankVersion;
  const pdfHashMatches = Boolean(
    questionBankPdfSha256
    && record?.pdfSha256?.toLowerCase() === questionBankPdfSha256,
  );
  const sampleExamVersion = record?.sampleExamVersion || null;
  const sampleExamSets = record?.sampleExamSets || [];
  const sampleExamVersionMatches = sampleExamSets.length
    ? sampleExamSets.every((sample) => sample.version === (configuredSampleSetVersions[sample.examLetter] || CTFL_QUESTION_BANK_SAMPLE_SET_VERSIONS[sample.examLetter]))
    : sampleExamVersion === questionBankSampleVersion;
  const sampleExamPdfHashMatches = sampleExamSets.length
    ? sampleExamSets.every((sample) => sampleSetHashes[sample.examLetter]?.questions === sample.questionsPdfSha256
      && sampleSetHashes[sample.examLetter]?.answers === sample.answersPdfSha256)
    : Boolean(questionBankSampleSha256 && record?.sampleQuestionsPdfSha256?.toLowerCase() === questionBankSampleSha256);
  let status = 'pending';

  if (record?.lastError) {
    status = 'error';
  } else if (record?.lastCheckedAt) {
    status = versionMatches && pdfHashMatches && sampleExamVersionMatches && sampleExamPdfHashMatches
      ? 'version-match'
      : 'review-required';
  }

  return {
    status,
    sourceUrl: record?.sourceUrl || CTFL_SYLLABUS_SOURCE_URL,
    officialVersion,
    questionBankVersion,
    versionMatches,
    pdfHashMatches,
    sampleExamLetter: record?.sampleExamLetter || null,
    sampleExamSets,
    sampleExamVersion,
    sampleExamAnswersVersion: record?.sampleExamAnswersVersion || null,
    sampleExamQuestionsPdfUrl: record?.sampleExamQuestionsPdfUrl || null,
    sampleExamAnswersPdfUrl: record?.sampleExamAnswersPdfUrl || null,
    sampleQuestionsPdfSha256: record?.sampleQuestionsPdfSha256 || null,
    sampleAnswersPdfSha256: record?.sampleAnswersPdfSha256 || null,
    questionBankSampleVersion,
    sampleExamVersionMatches,
    sampleExamPdfHashMatches,
    pdfUrl: record?.pdfUrl || null,
    pdfSha256: record?.pdfSha256 || null,
    lastCheckedAt: record?.lastCheckedAt || null,
    lastChangedAt: record?.lastChangedAt || null,
    lastError: record?.lastError || null,
    documents,
  };
}

export async function readCtflSyllabusStatus(prismaClient) {
  const database = prismaClient || (await import('./prisma.js')).prisma;
  const [record, documents] = await Promise.all([
    database.ctflSyllabusMonitor.findUnique({ where: { id: MONITOR_ID } }),
    database.ctflSyllabusDocument.findMany({
      orderBy: [{ lastSeenAt: 'desc' }, { id: 'asc' }],
      take: MAX_RETAINED_PDFS,
      select: {
        officialVersion: true,
        pdfUrl: true,
        pdfSha256: true,
        createdAt: true,
        lastSeenAt: true,
      },
    }),
  ]);
  return buildCtflSyllabusStatus(record, {}, documents);
}

export async function readCtflSyllabusDocument(pdfSha256, prismaClient) {
  const database = prismaClient || (await import('./prisma.js')).prisma;
  return database.ctflSyllabusDocument.findUnique({
    where: { pdfSha256: pdfSha256.toLowerCase() },
    select: { officialVersion: true, content: true },
  });
}

export async function storeCtflSyllabusDocument({
  pdfBytes,
  officialVersion,
  pdfUrl,
  pdfSha256,
  prismaClient,
  checkedAt = new Date(),
}) {
  const database = prismaClient || (await import('./prisma.js')).prisma;

  return database.$transaction(async (transaction) => {
    await transaction.$queryRaw`SELECT pg_advisory_xact_lock(${PDF_RETENTION_LOCK_ID})`;

    const existingDocument = await transaction.ctflSyllabusDocument.findUnique({
      where: { pdfSha256 },
    });

    if (existingDocument) {
      await transaction.ctflSyllabusDocument.update({
        where: { pdfSha256 },
        data: { officialVersion, pdfUrl, lastSeenAt: checkedAt },
      });
    } else {
      await transaction.ctflSyllabusDocument.create({
        data: {
          sourceUrl: CTFL_SYLLABUS_SOURCE_URL,
          officialVersion,
          pdfUrl,
          pdfSha256,
          content: pdfBytes,
          lastSeenAt: checkedAt,
        },
      });
    }

    const documentsToDelete = await transaction.ctflSyllabusDocument.findMany({
      orderBy: [{ lastSeenAt: 'desc' }, { id: 'asc' }],
      skip: MAX_RETAINED_PDFS,
      select: { id: true },
    });
    if (documentsToDelete.length > 0) {
      await transaction.ctflSyllabusDocument.deleteMany({
        where: { id: { in: documentsToDelete.map(({ id }) => id) } },
      });
    }

    return { created: !existingDocument };
  });
}

export async function checkOfficialCtflSyllabus({ fetchImpl = fetch, prismaClient } = {}) {
  const database = prismaClient || (await import('./prisma.js')).prisma;
  const existing = await database.ctflSyllabusMonitor.findUnique({
    where: { id: MONITOR_ID },
  });

  try {
    const pageResponse = await fetchImpl(CTFL_SYLLABUS_SOURCE_URL, createRequestOptions());
    if (!pageResponse.ok) {
      throw new Error(`A página oficial respondeu com HTTP ${pageResponse.status}.`);
    }

    const pageHtml = await pageResponse.text();
    const syllabus = extractOfficialSyllabus(pageHtml);
    const sampleExams = extractOfficialSampleExams(pageHtml);
    const [syllabusPdf, ...samplePdfResults] = await Promise.all([
      downloadOfficialPdf(fetchImpl, syllabus.pdfUrl, 'syllabus'),
      ...sampleExams.flatMap((sample) => [
        downloadOfficialPdf(fetchImpl, sample.questionsPdfUrl, `questões do Sample Exam ${sample.examLetter}`),
        downloadOfficialPdf(fetchImpl, sample.answersPdfUrl, `respostas do Sample Exam ${sample.examLetter}`),
      ]),
    ]);
    const sampleExamSets = sampleExams.map((sample, index) => ({
      ...sample,
      questionsPdfSha256: samplePdfResults[index * 2].pdfSha256,
      answersPdfSha256: samplePdfResults[index * 2 + 1].pdfSha256,
    }));
    const sampleExam = sampleExamSets[0];
    const questionsPdf = samplePdfResults[0];
    const answersPdf = samplePdfResults[1];
    const { pdfSha256 } = syllabusPdf;
    const now = new Date();
    const documentChanged = Boolean(existing && (
      existing.officialVersion !== syllabus.version
      || existing.pdfUrl !== syllabus.pdfUrl
      || existing.pdfSha256 !== pdfSha256
      || existing.sampleExamVersion !== sampleExam.version
      || existing.sampleExamQuestionsPdfSha256 !== questionsPdf.pdfSha256
      || existing.sampleExamAnswersPdfSha256 !== answersPdf.pdfSha256
      || JSON.stringify(existing.sampleExamSets || []) !== JSON.stringify(sampleExamSets)
    ));

    await storeCtflSyllabusDocument({
      pdfBytes: syllabusPdf.pdfBytes,
      officialVersion: syllabus.version,
      pdfUrl: syllabus.pdfUrl,
      pdfSha256,
      prismaClient: database,
      checkedAt: now,
    });

    const record = await database.ctflSyllabusMonitor.upsert({
      where: { id: MONITOR_ID },
      create: {
        id: MONITOR_ID,
        sourceUrl: CTFL_SYLLABUS_SOURCE_URL,
        officialVersion: syllabus.version,
        pdfUrl: syllabus.pdfUrl,
        pdfSha256,
        sampleExamLetter: sampleExam.examLetter,
        sampleExamSets,
        sampleExamVersion: sampleExam.version,
        sampleExamAnswersVersion: sampleExam.version,
        sampleExamQuestionsPdfUrl: sampleExam.questionsPdfUrl,
        sampleExamAnswersPdfUrl: sampleExam.answersPdfUrl,
        sampleQuestionsPdfSha256: questionsPdf.pdfSha256,
        sampleAnswersPdfSha256: answersPdf.pdfSha256,
        lastCheckedAt: now,
      },
      update: {
        sourceUrl: CTFL_SYLLABUS_SOURCE_URL,
        officialVersion: syllabus.version,
        pdfUrl: syllabus.pdfUrl,
        pdfSha256,
        sampleExamLetter: sampleExam.examLetter,
        sampleExamSets,
        sampleExamVersion: sampleExam.version,
        sampleExamAnswersVersion: sampleExam.version,
        sampleExamQuestionsPdfUrl: sampleExam.questionsPdfUrl,
        sampleExamAnswersPdfUrl: sampleExam.answersPdfUrl,
        sampleQuestionsPdfSha256: questionsPdf.pdfSha256,
        sampleAnswersPdfSha256: answersPdf.pdfSha256,
        lastCheckedAt: now,
        lastChangedAt: documentChanged ? now : existing?.lastChangedAt || null,
        lastError: null,
      },
    });

    return {
      success: true,
      documentChanged,
      ...buildCtflSyllabusStatus(record),
    };
  } catch (error) {
    const now = new Date();
    const lastError = String(error?.message || 'Falha desconhecida na checagem do syllabus.').slice(0, 300);
    await database.ctflSyllabusMonitor.upsert({
      where: { id: MONITOR_ID },
      create: {
        id: MONITOR_ID,
        sourceUrl: CTFL_SYLLABUS_SOURCE_URL,
        lastCheckedAt: now,
        lastError,
      },
      update: { lastCheckedAt: now, lastError },
    });
    throw error;
  }
}

export function isAuthorizedCronRequest(request, secret = process.env.CRON_SECRET) {
  if (!secret) return false;
  const authorization = request.headers?.authorization || request.headers?.Authorization || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  const expected = Buffer.from(secret);
  const received = Buffer.from(token);
  return expected.length === received.length && timingSafeEqual(expected, received);
}

export async function handleCtflSyllabusRequest(request, sendJson, sendPdf) {
  const routePath = (request.url || '').split('?')[0].replace(/^\/api(?=\/)/, '');

  if (routePath === '/ctfl/syllabus' && request.method === 'GET') {
    try {
      const database = (await import('./prisma.js')).prisma;
      const currentRecord = await database.ctflSyllabusMonitor.findUnique({
        where: { id: MONITOR_ID },
        select: { id: true },
      });

      // A new deployment may receive its first visit before the daily cron runs.
      // Seed the retained syllabus PDF on that first status request so the page
      // has a document to offer immediately after the initial check completes.
      if (!currentRecord) {
        try {
          await checkOfficialCtflSyllabus({ prismaClient: database });
        } catch {
          // The checker persists its error in the monitor row; return that status.
        }
      }

      sendJson(200, { success: true, ...(await readCtflSyllabusStatus(database)) });
    } catch (error) {
      console.error('Falha ao consultar status do syllabus CTFL:', error);
      sendJson(503, {
        success: false,
        message: 'Não foi possível consultar o status do syllabus. Verifique a conexão com o banco.',
      });
    }
    return true;
  }

  const documentMatch = routePath.match(/^\/ctfl\/syllabus\/documents\/([a-f\d]{64})$/i);
  if (documentMatch && request.method === 'GET') {
    try {
      const document = await readCtflSyllabusDocument(documentMatch[1]);
      if (!document) {
        sendJson(404, { success: false, message: 'PDF do syllabus não encontrado no histórico.' });
      } else if (sendPdf) {
        sendPdf(200, {
          fileName: `ctfl-syllabus-v${document.officialVersion}.pdf`,
          content: document.content,
        });
      } else {
        sendJson(500, { success: false, message: 'Download de PDF não está disponível nesta rota.' });
      }
    } catch (error) {
      console.error('Falha ao recuperar PDF CTFL salvo:', error);
      sendJson(503, { success: false, message: 'Não foi possível recuperar o PDF salvo.' });
    }
    return true;
  }

  if (routePath === '/ctfl/syllabus/check' && request.method === 'GET') {
    if (!process.env.CRON_SECRET) {
      sendJson(503, { success: false, message: 'CRON_SECRET não foi configurado para a checagem automática.' });
      return true;
    }

    if (!isAuthorizedCronRequest(request)) {
      sendJson(401, { success: false, message: 'Autorização inválida para a checagem automática.' });
      return true;
    }

    try {
      sendJson(200, await checkOfficialCtflSyllabus());
    } catch (error) {
      console.error('Falha ao verificar o syllabus oficial CTFL:', error);
      sendJson(503, {
        success: false,
        message: 'Não foi possível verificar a página e o PDF oficiais do ISTQB.',
      });
    }
    return true;
  }

  if (routePath === '/ctfl/syllabus' || routePath === '/ctfl/syllabus/check') {
    sendJson(405, { success: false, message: 'Método não permitido.' });
    return true;
  }

  return false;
}
