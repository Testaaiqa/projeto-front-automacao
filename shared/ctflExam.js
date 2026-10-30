export const CTFL_EXAM_QUESTION_COUNT = 40;
export const CTFL_EXAM_PASSING_SCORE = 26;

export const CTFL_EXAM_BLUEPRINT = [
  { chapter: 1, title: 'Fundamentos de Teste', questionCount: 8 },
  { chapter: 2, title: 'Testes ao longo do Ciclo de Vida', questionCount: 6 },
  { chapter: 3, title: 'Teste Estático', questionCount: 4 },
  { chapter: 4, title: 'Análise e Modelagem de Teste', questionCount: 11 },
  { chapter: 5, title: 'Gerenciamento das Atividades de Teste', questionCount: 9 },
  { chapter: 6, title: 'Ferramentas de Teste', questionCount: 2 },
];

function shuffle(items, random) {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}

export function prepareCtflExam(questions, random = Math.random) {
  const selectedQuestions = CTFL_EXAM_BLUEPRINT.flatMap(({ chapter, title, questionCount }) => {
    const chapterPool = questions.filter((question) => question.chapter === chapter);
    if (chapterPool.length < questionCount) {
      throw new Error(`Banco CTFL insuficiente para o capítulo ${chapter} (${title}).`);
    }
    return shuffle(chapterPool, random).slice(0, questionCount);
  });

  return shuffle(selectedQuestions, random).map((question) => {
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
  const chapterResults = CTFL_EXAM_BLUEPRINT.map(({ chapter, title }) => {
    const chapterQuestions = questions
      .map((question, index) => ({ question, answer: answers[index] }))
      .filter(({ question }) => question.chapter === chapter);
    const chapterCorrect = chapterQuestions.reduce(
      (count, { question, answer }) => count + (answer === question.answer ? 1 : 0),
      0,
    );

    return {
      chapter,
      title,
      totalQuestions: chapterQuestions.length,
      correctAnswers: chapterCorrect,
    };
  });

  return {
    totalQuestions: questions.length,
    answeredQuestions,
    unansweredQuestions: questions.length - answeredQuestions,
    correctAnswers,
    passingScore: CTFL_EXAM_PASSING_SCORE,
    passed: questions.length === CTFL_EXAM_QUESTION_COUNT
      && correctAnswers >= CTFL_EXAM_PASSING_SCORE,
    chapterResults,
  };
}
