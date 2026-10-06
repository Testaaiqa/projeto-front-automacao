export const CTFL_EXAM_QUESTION_COUNT = 40;
export const CTFL_EXAM_PASSING_SCORE = 26;

function shuffle(items, random) {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}

export function prepareCtflExam(questions, random = Math.random) {
  return shuffle(questions, random).map((question) => {
    const options = shuffle(
      question.options.map((text, index) => ({ text, isCorrect: index === question.answer })),
      random,
    );

    return {
      ...question,
      options: options.map(({ text }) => text),
      answer: options.findIndex(({ isCorrect }) => isCorrect),
    };
  });
}

export function gradeCtflAttempt(questions, answers) {
  const answeredQuestions = questions.reduce(
    (count, question, index) => count + (Number.isInteger(answers[index]) ? 1 : 0),
    0,
  );
  const correctAnswers = questions.reduce(
    (count, question, index) => count + (answers[index] === question.answer ? 1 : 0),
    0,
  );

  return {
    totalQuestions: questions.length,
    answeredQuestions,
    unansweredQuestions: questions.length - answeredQuestions,
    correctAnswers,
    passingScore: CTFL_EXAM_PASSING_SCORE,
    passed: questions.length === CTFL_EXAM_QUESTION_COUNT
      && correctAnswers >= CTFL_EXAM_PASSING_SCORE,
  };
}