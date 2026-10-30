import assert from 'node:assert/strict';
import test from 'node:test';
import questionBank from '../src/data/ctfl-question-bank.json' with { type: 'json' };
import {
  CTFL_EXAM_PASSING_SCORE,
  gradeCtflAttempt,
  prepareCtflExam,
} from './ctflExam.js';

test('official-format question bank contains 40 complete questions', () => {
  assert.equal(questionBank.questions.length, 40);
  assert.ok(questionBank.questions.every((question) => (
    question.options.length === 4
    && Number.isInteger(question.answer)
    && question.answer >= 0
    && question.answer < question.options.length
  )));
});

test('a result of 27 correct answers passes the 40-question CTFL exam', () => {
  const answers = questionBank.questions.map((question, index) => (
    index < 27 ? question.answer : (question.answer + 1) % question.options.length
  ));

  const result = gradeCtflAttempt(questionBank.questions, answers);

  assert.equal(result.totalQuestions, 40);
  assert.equal(result.answeredQuestions, 40);
  assert.equal(result.correctAnswers, 27);
  assert.equal(result.passingScore, CTFL_EXAM_PASSING_SCORE);
  assert.equal(result.passed, true);
});

test('25 correct answers do not pass the CTFL exam', () => {
  const answers = questionBank.questions.map((question, index) => (
    index < 25 ? question.answer : (question.answer + 1) % question.options.length
  ));

  assert.equal(gradeCtflAttempt(questionBank.questions, answers).passed, false);
});

test('randomization preserves the correct option for every question', () => {
  const randomized = prepareCtflExam(questionBank.questions, () => 0.42);
  const originals = new Map(questionBank.questions.map((question) => [question.id, question]));

  assert.equal(randomized.length, 40);
  const counts = randomized.reduce((result, question) => ({ ...result, [question.chapter]: (result[question.chapter] || 0) + 1 }), {});
  assert.deepEqual(counts, { 1: 8, 2: 6, 3: 4, 4: 11, 5: 9, 6: 2 });
  randomized.forEach((question) => {
    const original = originals.get(question.id);
    assert.equal(question.options[question.answer], original.options[original.answer]);
  });
});