import React, { useState, useEffect, useMemo } from "react";
import {
  type Quiz,
  type QuizItem,
  type AnswerState,
  type QuizState,
  type StepState,
} from "@/src/types/quiz";
import { mulberry32, shuffle } from "@/src/utils";
import { QuestionView } from "./QuestionView";
import { ActionButton } from "./ActionButton";
import {
  useLocale,
  LocaleOverrideProvider,
  type Translations,
  TranslationsContext,
} from "@/src/i18n";
import { routes } from "@/src/routes";
import {
  initQuizState,
  loadQuizState,
  saveQuizState,
  isComplete,
} from "../quiz-storage";

type SetState<T> = React.Dispatch<React.SetStateAction<T>>;

function getCurrentStep(state: QuizState): number {
  const completeIndex = state.steps.findLastIndex(isComplete);
  if (completeIndex < 0) return 0;
  return completeIndex + 1;
}

function getStepChange(current: Step, change: -1 | 1, max: number): Step {
  switch (change) {
    case -1:
      if (current === "review") return max;
      if (current === 0) return 0;
    case 1:
      if (current === "review") return "review";
      if (current >= max) return "review";
  }
  return current + change;
}

function shuffleAnswers(item: QuizItem, rng: () => number): QuizItem {
  const q = item.question;
  switch (q.type) {
    case "SingleChoice":
    case "MultiChoice":
      return { ...item, question: { ...q, answers: shuffle(q.answers, rng) } };
    case "Categorize":
      return {
        ...item,
        question: {
          ...q,
          categories: q.categories.map(
            (c: {
              text: string;
              answers: (typeof q.categories)[0]["answers"];
            }) => ({
              ...c,
              answers: shuffle(c.answers, rng),
            }),
          ),
        },
      };
    default:
      return item;
  }
}

function prepareQuestions(quiz: Quiz, seed: number): QuizItem[] {
  const rng = mulberry32(seed);
  const fm = quiz.frontmatter as Record<string, unknown> | undefined;
  const shouldShuffleQuestions = (fm?.shuffle_questions as boolean) ?? false;
  const globalShuffleAnswers = (fm?.shuffle_answers as boolean) ?? true;

  let questions = quiz.items.filter((item) => item.question);
  if (shouldShuffleQuestions) questions = shuffle(questions, rng);

  return questions.map((item) => {
    const meta = item.metadata as Record<string, unknown> | undefined;
    const shouldShuffle =
      (meta?.shuffle_answers as boolean) ?? globalShuffleAnswers;
    return shouldShuffle ? shuffleAnswers(item, rng) : item;
  });
}

type Step = number | "review";

export const QuizPlayer: React.FC<{
  quizId: string;
  quizHash: string;
  quiz: Quiz;
  translations: Translations;
}> = ({ quizId, quizHash, quiz, translations }) => {
  const quizName = (quiz.frontmatter as any)?.name ?? quizId;

  const [state, setState] = useState<QuizState>(initQuizState);
  const [currentStep, setCurrentStep] = useState<Step>(0);

  useEffect(() => {
    const loaded = loadQuizState(quizId, quizHash);
    if (!loaded) return;
    setState(loaded);
    const stateStep = getCurrentStep(loaded);
    setCurrentStep(stateStep <= quiz.items.length - 1 ? stateStep : "review");
  }, [quizId, quizHash]);

  useEffect(() => {
    if (!state.steps.length) return;
    saveQuizState(quizId, quizHash, state);
  }, [state]);

  const questions = useMemo(() => {
    if (!state?.seed) return [];
    return prepareQuestions(quiz, state.seed);
  }, [quiz, state?.seed]);

  return (
    <TranslationsContext.Provider value={translations}>
      {(() => {
        switch (currentStep) {
          case "review":
            return (
              <QuizFinishedStep
                quizName={quizName}
                questions={questions}
                state={state}
                onStateChange={setState}
                onCurrentStepChange={setCurrentStep}
              />
            );
          default:
            return (
              <QuestionStep
                quizName={quizName}
                questions={questions}
                state={state}
                onStateChange={setState}
                currentStep={currentStep}
                onCurrentStepChange={setCurrentStep}
              />
            );
        }
      })()}
    </TranslationsContext.Provider>
  );
};

const QuestionStep: React.FC<{
  quizName: string;
  questions: QuizItem[];
  state: QuizState;
  onStateChange: SetState<QuizState>;
  currentStep: number;
  onCurrentStepChange: SetState<Step>;
}> = ({
  quizName,
  questions,
  state,
  onStateChange,
  currentStep,
  onCurrentStepChange,
}) => {
  const { t } = useLocale();
  const question = questions[currentStep];

  const currentAnswers = state.steps[currentStep]?.answers;
  const correctAnswer = currentAnswers?.find((a) => a.correct);
  const lastAnswer = currentAnswers?.[currentAnswers.length - 1];

  const isReviewing = correctAnswer !== undefined;

  const handleReset = () => onStateChange((prev) => ({ ...prev, steps: [] }));

  const handleBack = () =>
    onCurrentStepChange((prev) =>
      getStepChange(prev, -1, questions.length - 1),
    );

  const handleNext = () =>
    onCurrentStepChange((prev) => getStepChange(prev, 1, questions.length - 1));

  const appendAnswer = (step: StepState, answer: AnswerState): StepState => {
    const answers = [...step.answers, answer];
    return { ...step, answers };
  };

  const addAnswer = (steps: StepState[], answer: AnswerState): StepState[] => {
    if (steps.length <= currentStep)
      return [...steps, { type: "question", answers: [answer] }];
    return steps.map((s, i) =>
      i === currentStep ? appendAnswer(s, answer) : s,
    );
  };

  const handleAnswer = (answer: AnswerState) => {
    onStateChange((prev) => ({
      ...prev,
      steps: addAnswer(prev.steps, answer),
    }));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-base sm:text-lg font-semibold text-text-secondary truncate mr-2">
          {quizName}
        </h1>
        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="text-xs text-text-muted hover:text-accent transition-colors cursor-pointer"
          >
            {t("reset")}
          </button>
          <span className="text-sm text-text-muted whitespace-nowrap">
            {currentStep + 1} / {questions.length}
          </span>
        </div>
      </div>
      <div className="w-full h-1 bg-bg-2 rounded-full mb-2">
        <div
          className="h-1 bg-accent rounded-full transition-all"
          style={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}
        />
      </div>
      {currentStep > 0 && (
        <button
          onClick={handleBack}
          className="text-sm text-text-muted hover:text-accent transition-colors cursor-pointer mb-2 flex flex-row justify-baseline align-baseline"
        >
          <div>←</div> <div>{t("goBack")}</div>
        </button>
      )}
      <div className="bg-bg-1 border border-border rounded-lg p-4 sm:p-6">
        <QuestionView
          key={
            isReviewing
              ? `review-${currentStep}`
              : `${state.seed}-${currentStep}`
          }
          item={question}
          onAnswer={handleAnswer}
          seed={state.seed ^ (currentStep + 1)}
          reviewAnswer={isReviewing ? correctAnswer : undefined}
        />
        {lastAnswer && !lastAnswer.correct && (
          <p className="text-sm text-incorrect mt-4 sm:mt-6">
            {t("wrongTryAgain")}
          </p>
        )}
        {isReviewing && lastAnswer && lastAnswer.correct && (
          <div className="mt-4 sm:mt-6">
            <ActionButton onClick={handleNext}>
              {!isReviewing && currentStep + 1 >= questions.length
                ? t("seeResults")
                : t("next")}
            </ActionButton>
          </div>
        )}
      </div>
    </div>
  );
};

const QuizFinishedStep: React.FC<{
  questions: QuizItem[];
  quizName: string;
  state: QuizState;
  onStateChange: SetState<QuizState>;
  onCurrentStepChange: SetState<Step>;
}> = ({ questions, quizName, state, onStateChange, onCurrentStepChange }) => {
  const { t } = useLocale();

  const score = state.steps.filter((s) => s.answers[0]?.correct).length;
  const total = questions.length;
  const incorrectIndices = state.steps
    .map((s, i) => (s.answers[0]?.correct ? -1 : i))
    .filter((i) => i >= 0);

  const handleReset = () => onStateChange((prev) => ({ ...prev, steps: [] }));

  const handleBack = () =>
    onCurrentStepChange((prev) =>
      getStepChange(prev, -1, questions.length - 1),
    );

  return (
    <div>
      <div className="bg-bg-1 border border-border rounded-lg p-6 sm:p-8 text-center">
        <h2 className="text-xl sm:text-2xl font-bold text-text-primary mb-2">
          {quizName}
        </h2>
        <p className="text-3xl sm:text-4xl font-bold text-accent mb-2">
          {score} / {total}
        </p>
        <p className="text-text-secondary mb-4 sm:mb-6">
          {Math.round((score / total) * 100)}
          {t("percentCorrect")}
        </p>
        {incorrectIndices.length > 0 && (
          <div className="text-left mb-4 sm:mb-6">
            <h3 className="text-sm font-semibold text-incorrect mb-2">
              {t("incorrectQuestions")}
            </h3>
            <ul className="space-y-1">
              {incorrectIndices.map((i) => (
                <li
                  key={i}
                  className="text-sm text-text-secondary bg-bg-2 rounded px-3 py-1.5"
                >
                  {questions[i].body.split("\n")[0].replace(/^#+\s*/, "")}
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="flex gap-3 justify-center">
          <ActionButton onClick={handleReset}>{t("tryAgain")}</ActionButton>
          <a
            href={routes.index}
            className="px-5 sm:px-6 py-2 bg-bg-2 text-text-primary font-semibold rounded-lg border border-border hover:border-accent transition-colors"
          >
            {t("allQuizzes")}
          </a>
        </div>
        <button
          onClick={handleBack}
          className="text-sm text-text-muted hover:text-accent transition-colors cursor-pointer mt-4"
        >
          ← {t("goBack")}
        </button>
      </div>
    </div>
  );
};
