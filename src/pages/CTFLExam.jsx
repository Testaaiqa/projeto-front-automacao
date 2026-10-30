import React, { useEffect, useState } from 'react';
import questionBank from '../data/ctfl-question-bank.json';
import { gradeCtflAttempt, prepareCtflExam } from '../../shared/ctflExam.js';

const STANDARD_DURATION_MINUTES = 60;
const EXTENDED_DURATION_MINUTES = 75;

function formatRemainingTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function CTFLExam() {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [hasExtraTimeEligibility, setHasExtraTimeEligibility] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(STANDARD_DURATION_MINUTES * 60);
  const [deadline, setDeadline] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const durationMinutes = hasExtraTimeEligibility
    ? EXTENDED_DURATION_MINUTES
    : STANDARD_DURATION_MINUTES;
  const currentQuestion = questions[questionIndex];
  const timeExpired = deadline !== null && remainingSeconds === 0;
  const finished = submitted || timeExpired;
  const answeredCount = answers.filter(Number.isInteger).length;
  const result = finished ? gradeCtflAttempt(questions, answers) : null;

  useEffect(() => {
    if (deadline === null || finished) return undefined;

    const updateRemainingTime = () => {
      setRemainingSeconds(Math.max(Math.ceil((deadline - Date.now()) / 1000), 0));
    };

    updateRemainingTime();
    const timerId = window.setInterval(updateRemainingTime, 1000);
    return () => window.clearInterval(timerId);
  }, [deadline, finished]);

  function startExam() {
    setQuestions(prepareCtflExam(questionBank.questions));
    setAnswers(Array(questionBank.questionCount).fill(null));
    setQuestionIndex(0);
    setRemainingSeconds(durationMinutes * 60);
    setDeadline(Date.now() + durationMinutes * 60 * 1000);
    setSubmitted(false);
    setShowReview(false);
  }

  function chooseAnswer(optionIndex) {
    if (finished) return;
    setAnswers((current) => {
      const next = [...current];
      next[questionIndex] = optionIndex;
      return next;
    });
  }

  function renderReview() {
    if (!showReview) return null;

    return (
      <ol className="ctfl-review-list" data-testid="ctfl-answer-review">
        {questions.map((question, index) => (
          <li className={answers[index] === question.answer ? 'correct' : 'incorrect'} key={question.id}>
            <strong>{index + 1}. {question.topic}</strong>
            <span>Capítulo {question.chapter} · {question.learningObjective}</span>
            <span>{question.question}</span>
            <span>Sua resposta: {answers[index] === null ? 'Não respondida' : question.options[answers[index]]}</span>
            <span>Gabarito: {question.options[question.answer]}</span>
            <span>{question.explanation}</span>
          </li>
        ))}
      </ol>
    );
  }

  if (finished) {
    const scorePercent = Math.round((result.correctAnswers / result.totalQuestions) * 100);

    return (
      <section className="ctfl-quiz" data-testid="ctfl-exam-result">
        <div className={`ctfl-result ${result.passed ? 'passed' : 'failed'}`}>
          <span className="ctfl-result-score">{result.correctAnswers}/{result.totalQuestions}</span>
          <h3>{result.passed ? 'Aprovado no simulado' : 'Continue estudando'}</h3>
          <p>{scorePercent}% de acertos · mínimo de {result.passingScore}/{result.totalQuestions}</p>
          <p>
            {timeExpired ? 'Tempo esgotado. ' : 'Simulado finalizado. '}
            {result.answeredQuestions} respondidas · {result.unansweredQuestions} em branco.
          </p>
          <section className="ctfl-chapter-results" aria-labelledby="ctfl-chapter-results-title">
            <h4 id="ctfl-chapter-results-title">Resultado por capítulo</h4>
            <ul>
              {result.chapterResults.map((chapter) => (
                <li key={chapter.chapter}>
                  <span>Capítulo {chapter.chapter} · {chapter.title}</span>
                  <strong>{chapter.correctAnswers}/{chapter.totalQuestions}</strong>
                </li>
              ))}
            </ul>
          </section>
          <div className="ctfl-result-actions">
            <button className="secondary-action" type="button" onClick={() => setShowReview((current) => !current)}>
              {showReview ? 'Ocultar revisão' : 'Revisar questões'}
            </button>
            <button className="primary-action" type="button" onClick={startExam}>Novo simulado</button>
          </div>
        </div>
        {renderReview()}
      </section>
    );
  }

  if (!deadline) {
    return (
      <section className="ctfl-quiz ctfl-exam-setup" data-testid="ctfl-exam-setup">
        <div className="ctfl-exam-summary">
          <span>SIMULADO CTFL · QUESTÕES AUTORAIS</span>
          <strong>{questionBank.questionCount} questões · aprovação com {questionBank.passingScore} acertos</strong>
          <small>
            BSTQB CTFL v{questionBank.sourceSyllabusVersion} · banco {questionBank.bankVersion}
            {' · ' + questionBank.questionPoolCount + ' questões no banco de prática'}
          </small>
        </div>
        <h3>Tempo de prova</h3>
        <p className="ctfl-setup-note">O exame CTFL do BSTQB tem duração padrão de {STANDARD_DURATION_MINUTES} minutos.</p>
        <label className="ctfl-extra-time-option">
          <input
            type="checkbox"
            checked={hasExtraTimeEligibility}
            onChange={(event) => setHasExtraTimeEligibility(event.target.checked)}
          />
          <span>
            Sou estrangeiro(a) e farei o exame em português. Simular o acréscimo de 25% ({EXTENDED_DURATION_MINUTES} minutos), conforme a regra do BSTQB.
          </span>
        </label>
        <p className="ctfl-setup-note">
          Cada tentativa segue a distribuição oficial por capítulo. Questões e alternativas são embaralhadas; o gabarito aparece ao final.
        </p>
        <button className="primary-action" type="button" onClick={startExam}>
          Iniciar simulado · {durationMinutes} min
        </button>
      </section>
    );
  }

  return (
    <section className="ctfl-quiz" data-testid="ctfl-exam">
      <div className="ctfl-quiz-toolbar">
        <div className="ctfl-quiz-meta">
          <span>Capítulo {currentQuestion.chapter} · {currentQuestion.topic}</span>
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
        <button className="primary-action ctfl-finish-exam-button" type="button" onClick={() => setSubmitted(true)}>
          Finalizar simulado
        </button>
      </div>
      <div className="ctfl-progress" aria-label={`Progresso: questão ${questionIndex + 1} de ${questions.length}`}>
        <span style={{ width: `${((questionIndex + 1) / questions.length) * 100}%` }} />
      </div>
      <h3 className="ctfl-question">{currentQuestion.question}</h3>
      <fieldset className="ctfl-options">
        <legend className="ctfl-visually-hidden">Escolha uma resposta</legend>
        {currentQuestion.options.map((option, index) => (
          <label
            className={`ctfl-option ${answers[questionIndex] === index ? 'selected' : ''}`}
            key={option}
          >
            <input
              type="radio"
              name={`ctfl-answer-${questionIndex}`}
              value={index}
              checked={answers[questionIndex] === index}
              onChange={() => chooseAnswer(index)}
            />
            <span>{option}</span>
          </label>
        ))}
      </fieldset>
      <nav className="ctfl-question-nav" aria-label="Navegação das questões">
        {questions.map((question, index) => (
          <button
            aria-current={questionIndex === index ? 'step' : undefined}
            aria-label={`Questão ${index + 1}${Number.isInteger(answers[index]) ? ', respondida' : ', não respondida'}`}
            className={`${questionIndex === index ? 'current' : ''} ${Number.isInteger(answers[index]) ? 'answered' : ''}`}
            key={question.id}
            onClick={() => setQuestionIndex(index)}
            type="button"
          >
            {index + 1}
          </button>
        ))}
      </nav>
      <div className="ctfl-exam-actions">
        <span>{answeredCount}/{questions.length} respondidas</span>
        <div>
          <button
            className="secondary-action"
            type="button"
            onClick={() => setQuestionIndex((current) => Math.max(current - 1, 0))}
            disabled={questionIndex === 0}
          >
            Anterior
          </button>
          <button
            className="secondary-action"
            type="button"
            onClick={() => setQuestionIndex((current) => Math.min(current + 1, questions.length - 1))}
            disabled={questionIndex === questions.length - 1}
          >
            Próxima
          </button>
        </div>
      </div>
    </section>
  );
}

export default CTFLExam;
