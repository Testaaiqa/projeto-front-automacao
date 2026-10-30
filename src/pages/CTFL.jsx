import React, { useEffect, useState } from 'react';
import questionBank from '../data/ctfl-question-bank.json';
import { getCtflSyllabusDocumentUrl, getCtflSyllabusStatus } from '../services/userService.js';
import CTFLExam from './CTFLExam.jsx';

function formatCheckDate(value) {
  if (!value) return 'Ainda não verificado';
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

function CTFL() {
  const [syllabusMonitor, setSyllabusMonitor] = useState({ loading: true, data: null, error: '' });

  useEffect(() => {
    let active = true;

    getCtflSyllabusStatus().then((result) => {
      if (!active) return;
      setSyllabusMonitor({
        loading: false,
        data: result.success ? result : null,
        error: result.success ? '' : result.message,
      });
    });

    return () => {
      active = false;
    };
  }, []);

  const officialVersion = syllabusMonitor.data?.officialVersion || null;
  const questionBankVersion = syllabusMonitor.data?.questionBankVersion || questionBank.sourceSyllabusVersion;
  const officialSampleVersion = syllabusMonitor.data?.sampleExamVersion || 'desconhecida';
  const questionBankSampleVersion = syllabusMonitor.data?.questionBankSampleVersion || questionBank.sourceSampleExamVersion;
  const monitorState = syllabusMonitor.loading
    ? 'loading'
    : syllabusMonitor.data?.status || 'unavailable';
  const monitorReviewReasons = [];

  if (monitorState === 'review-required') {
    if (!syllabusMonitor.data?.versionMatches) {
      monitorReviewReasons.push('a versão do syllabus oficial difere da referência do banco');
    } else if (!syllabusMonitor.data?.pdfHashMatches) {
      monitorReviewReasons.push('o PDF do syllabus ainda precisa de revisão');
    }

    if (!syllabusMonitor.data?.sampleExamVersionMatches) {
      monitorReviewReasons.push('a versão do Sample Exam difere da referência do banco');
    } else if (!syllabusMonitor.data?.sampleExamPdfHashMatches) {
      monitorReviewReasons.push('o PDF do Sample Exam ainda precisa de revisão');
    }
  }

  const monitorMessage = syllabusMonitor.loading
    ? 'Carregando a verificação automática...'
    : monitorState === 'review-required'
      ? 'Revisão necessária: ' + monitorReviewReasons.join('; ') + '.'
      : monitorState === 'version-match'
        ? 'As versões e os PDFs correspondem às referências aprovadas; isso não substitui a revisão do conteúdo das questões.'
        : monitorState === 'error'
          ? 'A última checagem falhou: ' + (syllabusMonitor.data?.lastError || 'verifique a conexão com a fonte oficial.')
          : monitorState === 'pending'
            ? 'Aguardando a primeira checagem automática.'
            : 'Status indisponível' + (syllabusMonitor.error ? ': ' + syllabusMonitor.error : '.');

  return (
    <section className="ctfl-page" data-testid="ctfl-page">
      <header className="ctfl-heading">
        <div>
          <span className="banking-eyebrow">CERTIFICAÇÃO · ISTQB</span>
          <h2>Prepare-se para o CTFL</h2>
          <p>Estude com questoes autorais em portugues, baseadas no syllabus adotado pelo BSTQB, e acompanhe as referencias oficiais.</p>
        </div>
        <a
          className="ctfl-source-link"
          href={questionBank.sourceSyllabusUrl}
          target="_blank"
          rel="noreferrer"
        >
          Materiais oficiais <span aria-hidden="true">↗</span>
        </a>
      </header>

      <section className="ctfl-syllabus" aria-labelledby="ctfl-syllabus-title">
        <div className="ctfl-syllabus-info">
          <span className="ctfl-status-dot" aria-hidden="true" />
          <div>
            <h3 id="ctfl-syllabus-title">Referência oficial do conteúdo</h3>
            <p>
              {officialVersion
                ? 'Syllabus oficial: v' + officialVersion
                : 'Versão oficial: aguardando checagem'}
              {' · banco de estudo: v' + questionBankVersion}
            </p>
            <p className={'ctfl-monitor-status ' + monitorState} role="status" data-testid="ctfl-syllabus-status">
              {monitorMessage}
            </p>
            <span className="ctfl-monitor-metadata">
              Última checagem: {formatCheckDate(syllabusMonitor.data?.lastCheckedAt)}
              {syllabusMonitor.data?.lastChangedAt && ' · PDF alterado: ' + formatCheckDate(syllabusMonitor.data.lastChangedAt)}
            </span>
            {syllabusMonitor.data?.pdfSha256 && (
              <span className="ctfl-monitor-metadata">
                SHA-256 do syllabus: {syllabusMonitor.data.pdfSha256.slice(0, 16)}…
              </span>
            )}
            {syllabusMonitor.data?.sampleExamSets?.length ? syllabusMonitor.data.sampleExamSets.map((sample) => (
              <div className="ctfl-sample-source" data-testid={'ctfl-sample-source-' + sample.examLetter} key={sample.examLetter}>
                <strong>Sample Exam {sample.examLetter} · v{sample.version}</strong>
                <div className="ctfl-sample-source-links">
                  <a className="ctfl-retained-link" href={sample.questionsPdfUrl} target="_blank" rel="noreferrer">PDF de questões <span aria-hidden="true">↗</span></a>
                  <a className="ctfl-retained-link" href={sample.answersPdfUrl} target="_blank" rel="noreferrer">PDF de respostas <span aria-hidden="true">↗</span></a>
                </div>
                <span className="ctfl-monitor-metadata">Hash de questões: {sample.questionsPdfSha256?.slice(0, 16)}… · hash de respostas: {sample.answersPdfSha256?.slice(0, 16)}…</span>
              </div>
            )) : syllabusMonitor.data?.sampleExamVersion && (
              <div className="ctfl-sample-source" data-testid="ctfl-sample-source">
                <strong>
                  Sample Exam {syllabusMonitor.data.sampleExamLetter} · v{officialSampleVersion}
                </strong>
                <span className="ctfl-monitor-metadata">
                  Questões v{officialSampleVersion} · respostas v{syllabusMonitor.data.sampleExamAnswersVersion}
                  {' · banco baseado em v' + questionBankSampleVersion}
                </span>
                <div className="ctfl-sample-source-links">
                  <a className="ctfl-retained-link" href={syllabusMonitor.data.sampleExamQuestionsPdfUrl} target="_blank" rel="noreferrer">
                    PDF de questões <span aria-hidden="true">↗</span>
                  </a>
                  <a className="ctfl-retained-link" href={syllabusMonitor.data.sampleExamAnswersPdfUrl} target="_blank" rel="noreferrer">
                    PDF de respostas <span aria-hidden="true">↗</span>
                  </a>
                </div>
                {syllabusMonitor.data.sampleQuestionsPdfSha256 && (
                  <span className="ctfl-monitor-metadata">
                    Hash das questões: {syllabusMonitor.data.sampleQuestionsPdfSha256.slice(0, 16)}…
                  </span>
                )}
              </div>
            )}
            {syllabusMonitor.data?.documents?.length > 0 && (
              <div className="ctfl-retained-documents" data-testid="ctfl-retained-documents">
                <span className="ctfl-retained-title">
                  Syllabi guardados ({syllabusMonitor.data.documents.length}/2)
                </span>
                {syllabusMonitor.data.documents.map((document, index) => (
                  <a
                    className="ctfl-retained-link"
                    href={getCtflSyllabusDocumentUrl(document.pdfSha256)}
                    key={document.pdfSha256}
                  >
                    <span>{index === 0 ? 'Atual' : 'Anterior'} · CTFL v{document.officialVersion}</span>
                    <span aria-hidden="true">↓</span>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="ctfl-quiz-layout">
        <CTFLExam />
        <aside className="ctfl-side-note">
          <span className="banking-eyebrow">SUA PREPARAÇÃO</span>
          <strong>Simulado CTFL</strong>
          <p>40 questões autorais para praticar os tópicos da versão de referência. Quando a referência oficial muda, o monitor sinaliza que o banco precisa de revisão.</p>
          <div className="ctfl-note-divider" />
          <span className="ctfl-note-label">REFERÊNCIA DO BANCO</span>
          <span className="ctfl-note-value">Syllabus v{questionBank.sourceSyllabusVersion} · banco v{questionBank.bankVersion}</span>
          <span className="ctfl-note-label">ÚLTIMA CHECAGEM</span>
          <span className="ctfl-note-value">
            {syllabusMonitor.data?.lastCheckedAt
              ? formatCheckDate(syllabusMonitor.data.lastCheckedAt)
              : syllabusMonitor.error || 'Aguardando a primeira checagem automática'}
          </span>
        </aside>
      </div>
    </section>
  );
}

export default CTFL;
