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
  const [durationMinutes, setDurationMinutes] = useState(STANDARD_DURATION_MINUTES);
  const [remainingSeconds, setRemainingSeconds] = useState(STANDARD_DURATION_MINUTES * 60);
  const [deadline, setDeadline] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [showReview, setShowReview] = useState(false);
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

  function finishExam() {
    setSubmitted(true);
  }

  function renderReview() {
    if (!showReview) return null;

    return (
      <ol className="ctfl-review-list" data-testid="ctfl-answer-review">
        {questions.map((question, index) => (
          <li className={answers[index] === question.answer ? 'correct' : 'incorrect'} key={question.id}>
            <strong>{index + 1}. {question.topic}</strong>
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
          <h3>{result.passed ? 'Aprovado' : 'Não aprovado'}</h3>
          <p>{scorePercent}% de acertos · mínimo de {result.passingScore}/{result.totalQuestions}</p>
          <p>
            {timeExpired ? 'Tempo esgotado. ' : 'Prova finalizada. '}
            {result.answeredQuestions} respondidas · {result.unansweredQuestions} em branco.
          </p>
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
          <span>SIMULADO CTFL · QUESTÕES ORIGINAIS</span>
          <strong>{questionBank.questionCount} questões · aprovação com {questionBank.passingScore} acertos</strong>
          <small>Referência de conteúdo: syllabus CTFL v{questionBank.sourceSyllabusVersion} · banco {questionBank.bankVersion}</small>
        </div>
        <h3>Escolha a duração</h3>
        <fieldset className="ctfl-time-options">
          <legend className="ctfl-visually-hidden">Duração do simulado</legend>
          {[STANDARD_DURATION_MINUTES, EXTENDED_DURATION_MINUTES].map((duration) => (
            <label
              className={`ctfl-time-option ${durationMinutes === duration ? 'selected' : ''}`}
              key={duration}
            >
              <input
                type="radio"
                name="ctfl-exam-duration"
                value={duration}
                checked={durationMinutes === duration}
                onChange={() => setDurationMinutes(duration)}
              />
              <span>{duration} minutos</span>
              <small>{duration === STANDARD_DURATION_MINUTES ? 'Tempo padrão' : '+25% · idioma não nativo'}</small>
            </label>
          ))}
        </fieldset>
        <p className="ctfl-setup-note">
          Questões e alternativas são embaralhadas em cada tentativa. As respostas e o gabarito só aparecem após finalizar.
        </p>
        <button className="primary-action" type="button" onClick={startExam}>
          Iniciar prova · {durationMinutes} min
        </button>
      </section>
    );
  }

  return (
    <section className="ctfl-quiz" data-testid="ctfl-exam">
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
        <button className="primary-action ctfl-finish-exam-button" type="button" onClick={finishExam}>
          Finalizar prova
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