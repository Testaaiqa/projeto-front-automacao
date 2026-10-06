import React, { useEffect, useState } from 'react';
import { getCtflSyllabusDocumentUrl, getCtflSyllabusStatus } from '../services/userService.js';
import CTFLExam from './CTFLExam.jsx';

const STANDARD_DURATION_MINUTES = 60;
const EXTENDED_DURATION_MINUTES = 75;

function formatRemainingTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function formatCheckDate(value) {
  if (!value) return 'Ainda não verificado';
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

const aiDemoQuestions = [
  {
    topic: 'Análise de testes',
    question: 'Uma equipe revisa critérios de aceite antes da implementação. Qual benefício de teste antecipado ela busca?',
    options: [
      'Evitar qualquer necessidade de execução de testes',
      'Encontrar ambiguidades e riscos antes que avancem no ciclo',
      'Garantir que o produto não terá falhas',
      'Substituir a validação com usuários',
    ],
    answer: 1,
    explanation: 'Revisões antecipadas ajudam a detectar problemas nos requisitos antes de eles se propagarem.',
  },
  {
    topic: 'Qualidade do software',
    question: 'Um teste passou em todas as execuções realizadas. O que é correto concluir?',
    options: [
      'O sistema está livre de defeitos',
      'Nenhum outro teste é necessário',
      'O comportamento esperado ocorreu nos casos executados',
      'Os requisitos estão completos',
    ],
    answer: 2,
    explanation: 'O resultado se limita aos casos executados; não demonstra ausência de defeitos em todo o produto.',
  },
  {
    topic: 'Depuração',
    question: 'Após um teste revelar um comportamento incorreto, qual atividade busca a causa no código?',
    options: ['Depuração', 'Planejamento', 'Monitoramento', 'Reteste'],
    answer: 0,
    explanation: 'A depuração investiga a causa da falha e apoia sua correção.',
  },
];

function CTFL() {
  const [mode, setMode] = useState('syllabus');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [syllabusFile, setSyllabusFile] = useState(null);
  const [syllabusMonitor, setSyllabusMonitor] = useState({ loading: true, data: null, error: '' });
  const [examDurationMinutes, setExamDurationMinutes] = useState(STANDARD_DURATION_MINUTES);
  const [remainingSeconds, setRemainingSeconds] = useState(STANDARD_DURATION_MINUTES * 60);
  const [deadline, setDeadline] = useState(null);
  const [quizStarted, setQuizStarted] = useState(false);
  const questions = aiDemoQuestions;
  const currentQuestion = questions[questionIndex];
  const timeExpired = quizStarted && remainingSeconds === 0;
  const finished = quizStarted && (questionIndex === questions.length || timeExpired);

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

  useEffect(() => {
    if (!quizStarted || finished || deadline === null) return undefined;

    const updateRemainingTime = () => {
      setRemainingSeconds(Math.max(Math.ceil((deadline - Date.now()) / 1000), 0));
    };

    updateRemainingTime();
    const timerId = window.setInterval(() => {
      updateRemainingTime();
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [deadline, finished, quizStarted]);

  function changeMode(nextMode) {
    setMode(nextMode);
    setQuestionIndex(0);
    setSelectedOption(null);
    setCorrectAnswers(0);
    setAnswered(false);
    setRemainingSeconds(examDurationMinutes * 60);
    setDeadline(null);
    setQuizStarted(false);
  }

  function startQuiz() {
    setQuestionIndex(0);
    setSelectedOption(null);
    setCorrectAnswers(0);
    setAnswered(false);
    setRemainingSeconds(examDurationMinutes * 60);
    setDeadline(Date.now() + examDurationMinutes * 60 * 1000);
    setQuizStarted(true);
  }

  function submitAnswer() {
    if (selectedOption === null || answered) return;
    if (selectedOption === currentQuestion.answer) {
      setCorrectAnswers((current) => current + 1);
    }
    setAnswered(true);
  }

  function advanceQuestion() {
    setQuestionIndex((current) => current + 1);
    setSelectedOption(null);
    setAnswered(false);
  }

  function restartQuiz() {
    startQuiz();
  }

  function handleSyllabusUpload(event) {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSyllabusFile({ name: file.name, updatedAt: new Date() });
    } else {
      setSyllabusFile(null);
    }
  }

  const officialVersion = syllabusMonitor.data?.officialVersion || 'desconhecida';
  const questionBankVersion = syllabusMonitor.data?.questionBankVersion || '4.0.1';
  const officialSampleVersion = syllabusMonitor.data?.sampleExamVersion || 'desconhecida';
  const questionBankSampleVersion = syllabusMonitor.data?.questionBankSampleVersion || '1.7';
  const monitorState = syllabusMonitor.loading
    ? 'loading'
    : syllabusMonitor.data?.status || 'unavailable';
  const monitorReviewReasons = [];
  if (monitorState === 'review-required') {
    if (!syllabusMonitor.data?.versionMatches) {
      monitorReviewReasons.push(`syllabus oficial v${officialVersion} versus base v${questionBankVersion}`);
    } else if (!syllabusMonitor.data?.pdfHashMatches) {
      monitorReviewReasons.push('hash do syllabus ainda não aprovado');
    }
    if (!syllabusMonitor.data?.sampleExamVersionMatches) {
      monitorReviewReasons.push(`Sample Exam ${syllabusMonitor.data?.sampleExamLetter || 'A'} oficial v${officialSampleVersion} versus JSON v${questionBankSampleVersion}`);
    } else if (!syllabusMonitor.data?.sampleExamPdfHashMatches) {
      monitorReviewReasons.push('hash do PDF de questões de exemplo ainda não aprovado');
    }
  }
  const monitorMessage = syllabusMonitor.loading
    ? 'Carregando o resultado da verificação automática...'
    : monitorState === 'review-required'
      ? `Revisão necessária: ${monitorReviewReasons.join('; ')}.`
      : monitorState === 'version-match'
        ? `Versões e hashes do syllabus e do simulado correspondem às referências aprovadas. Isso não substitui a revisão semântica das questões.`
        : monitorState === 'error'
          ? `A última checagem falhou: ${syllabusMonitor.data?.lastError || 'verifique a conexão com a fonte oficial.'}`
          : monitorState === 'pending'
            ? 'Aguardando a primeira checagem automática.'
            : `Status indisponível${syllabusMonitor.error ? `: ${syllabusMonitor.error}` : '.'}`;

  return (
    <section className="ctfl-page" data-testid="ctfl-page">
      <header className="ctfl-heading">
        <div>
          <span className="banking-eyebrow">CERTIFICAÇÃO · ISTQB</span>
          <h2>Prepare-se para o CTFL</h2>
          <p>Pratique conceitos de teste de software e acompanhe a referência do syllabus.</p>
        </div>
        <a
          className="ctfl-source-link"
          href="https://www.istqb.org/certifications/certified-tester-foundation-level"
          target="_blank"
          rel="noreferrer"
        >
          Fonte oficial <span aria-hidden="true">↗</span>
        </a>
      </header>

      <section className="ctfl-syllabus" aria-labelledby="ctfl-syllabus-title">
        <div className="ctfl-syllabus-info">
          <span className="ctfl-status-dot" aria-hidden="true" />
          <div>
            <h3 id="ctfl-syllabus-title">Syllabus de referência</h3>
            <p>Versão oficial: v{officialVersion} · base de questões: v{questionBankVersion}</p>
            <p className={`ctfl-monitor-status ${monitorState}`} role="status" data-testid="ctfl-syllabus-status">
              {monitorMessage}
            </p>
            <span className="ctfl-monitor-metadata">
              Última checagem: {formatCheckDate(syllabusMonitor.data?.lastCheckedAt)}
              {syllabusMonitor.data?.lastChangedAt && ` · PDF alterado: ${formatCheckDate(syllabusMonitor.data.lastChangedAt)}`}
            </span>
            {syllabusMonitor.data?.pdfSha256 && (
              <span className="ctfl-monitor-metadata">
                SHA-256 do PDF: {syllabusMonitor.data.pdfSha256.slice(0, 16)}…
              </span>
            )}
            {syllabusMonitor.data?.sampleExamVersion && (
              <div className="ctfl-sample-source" data-testid="ctfl-sample-source">
                <strong>
                  PDF de referência: Sample Exam {syllabusMonitor.data.sampleExamLetter} · v{officialSampleVersion}
                </strong>
                <span className="ctfl-monitor-metadata">
                  Questões v{officialSampleVersion} · respostas v{syllabusMonitor.data.sampleExamAnswersVersion}
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
                  PDFs guardados ({syllabusMonitor.data.documents.length}/2)
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
            {syllabusFile && (
              <span className="ctfl-upload-status" role="status">
                PDF selecionado: {syllabusFile.name}. A extração e a sincronização ainda não estão conectadas.
              </span>
            )}
          </div>
        </div>
        <label className="ctfl-upload-button">
          <input
            type="file"
            accept="application/pdf,.pdf"
            onChange={handleSyllabusUpload}
            data-testid="ctfl-syllabus-upload"
          />
          Selecionar PDF
        </label>
      </section>

      <div className="ctfl-mode-switch" role="tablist" aria-label="Tipo de simulado">
        <button
          className={mode === 'syllabus' ? 'active' : ''}
          type="button"
          role="tab"
          aria-selected={mode === 'syllabus'}
          onClick={() => changeMode('syllabus')}
        >
          Syllabus oficial
        </button>
        <button
          className={mode === 'ai' ? 'active' : ''}
          type="button"
          role="tab"
          aria-selected={mode === 'ai'}
          onClick={() => changeMode('ai')}
        >
          Perguntas com IA <span className="ctfl-coming-tag">EM PREPARAÇÃO</span>
        </button>
      </div>

      <div className="ctfl-quiz-layout">
        {mode === 'syllabus' ? (
          <CTFLExam />
        ) : (
        <section className="ctfl-quiz" aria-live="polite">
          {mode === 'ai' && (
            <div className="ctfl-demo-notice" role="status">
              Demonstração local com perguntas autorais. A geração por IA será habilitada após conectar um provedor no servidor.
            </div>
          )}
          {finished ? (
            <div className="ctfl-result" data-testid="ctfl-result">
              <span className="ctfl-result-score">{correctAnswers}/{questions.length}</span>
              <h3>{timeExpired ? 'Tempo esgotado' : 'Simulado concluído'}</h3>
              <p>{timeExpired
                ? `O tempo acabou. Você respondeu ${questionIndex} de ${questions.length} questões e acertou ${correctAnswers}.`
                : `Você acertou ${correctAnswers} de ${questions.length} questões.`}</p>
              <button className="secondary-action" type="button" onClick={restartQuiz}>Refazer simulado</button>
            </div>
          ) : !quizStarted ? (
            <div className="ctfl-setup">
              <div className="ctfl-exam-summary">
                <span>{mode === 'ai' ? 'DEMONSTRAÇÃO · PERCURSO IA' : 'FORMATO OFICIAL CTFL'}</span>
                <strong>{mode === 'ai'
                  ? `${questions.length} questões de demonstração`
                  : '40 questões · aprovação com 26 acertos'}</strong>
              </div>
              <h3>Escolha a duração</h3>
              <fieldset className="ctfl-time-options">
                <legend className="ctfl-visually-hidden">Duração do simulado</legend>
                {[STANDARD_DURATION_MINUTES, EXTENDED_DURATION_MINUTES].map((duration) => (
                  <label
                    className={`ctfl-time-option ${examDurationMinutes === duration ? 'selected' : ''}`}
                    key={duration}
                  >
                    <input
                      type="radio"
                      name="ctfl-duration"
                      value={duration}
                      checked={examDurationMinutes === duration}
                      onChange={() => {
                        setExamDurationMinutes(duration);
                        setRemainingSeconds(duration * 60);
                      }}
                    />
                    <span>{duration} minutos</span>
                    {duration === STANDARD_DURATION_MINUTES && <small>Tempo padrão</small>}
                    {duration === EXTENDED_DURATION_MINUTES && <small>+25% · idioma não nativo</small>}
                  </label>
                ))}
              </fieldset>
              <p className="ctfl-setup-note">
                {mode === 'ai'
                  ? 'Perguntas demonstrativas até a conexão com o provedor de IA.'
                  : 'A prova oficial tem 60 minutos. O ISTQB prevê 25% de tempo adicional para candidatos que fazem a prova em idioma não nativo.'}
              </p>
              <button className="primary-action" type="button" onClick={startQuiz}>
                Iniciar simulado · {examDurationMinutes} min
              </button>
            </div>
          ) : (
            <>
              <div className="ctfl-quiz-toolbar">
                <div className="ctfl-quiz-meta">
                  <span>{currentQuestion.topic}</span>
                  <span>Questão {questionIndex + 1} de {questions.length}</span>
                </div>
                <div
                  className={`ctfl-timer ${remainingSeconds <= 300 ? 'is-low' : ''}`}
                  role="timer"
                  aria-label={`Tempo restante: ${formatRemainingTime(remainingSeconds)}`}
                  data-testid="ctfl-timer"
                >
                  <span>Tempo restante</span>
                  <strong>{formatRemainingTime(remainingSeconds)}</strong>
                </div>
              </div>
              <div className="ctfl-progress" aria-label={`Progresso: questão ${questionIndex + 1} de ${questions.length}`}>
                <span style={{ width: `${((questionIndex + 1) / questions.length) * 100}%` }} />
              </div>
              <h3 className="ctfl-question">{currentQuestion.question}</h3>
              <fieldset className="ctfl-options" disabled={answered}>
                <legend className="ctfl-visually-hidden">Escolha uma resposta</legend>
                {currentQuestion.options.map((option, index) => (
                  <label
                    className={`ctfl-option ${selectedOption === index ? 'selected' : ''} ${answered && index === currentQuestion.answer ? 'correct' : ''} ${answered && selectedOption === index && index !== currentQuestion.answer ? 'incorrect' : ''}`}
                    key={option}
                  >
                    <input
                      type="radio"
                      name="ctfl-answer"
                      value={index}
                      checked={selectedOption === index}
                      onChange={() => setSelectedOption(index)}
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </fieldset>
              {answered && <p className="ctfl-explanation">{currentQuestion.explanation}</p>}
              <div className="ctfl-quiz-actions">
                <span>{correctAnswers} acertos</span>
                {answered ? (
                  <button className="primary-action" type="button" onClick={advanceQuestion}>
                    {questionIndex === questions.length - 1 ? 'Ver resultado' : 'Próxima questão'}
                  </button>
                ) : (
                  <button className="primary-action" type="button" onClick={submitAnswer} disabled={selectedOption === null}>
                    Confirmar resposta
                  </button>
                )}
              </div>
            </>
          )}
        </section>
        )}

        <aside className="ctfl-side-note">
          <span className="banking-eyebrow">SUA PREPARAÇÃO</span>
          <strong>{mode === 'syllabus' ? 'Baseado no syllabus' : 'Geração inteligente'}</strong>
          <p>{mode === 'syllabus'
            ? 'Prova completa com 40 questões originais, montada para praticar os tópicos e o formato do CTFL.'
            : 'Este percurso está em demonstração. As perguntas ainda não são geradas por um modelo de IA.'}</p>
          <div className="ctfl-note-divider" />
          <span className="ctfl-note-label">FONTE</span>
          <span className="ctfl-note-value">{mode === 'syllabus' ? 'Banco CTFL original v1.0.0' : `Banco de referência v${questionBankVersion}`}</span>
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