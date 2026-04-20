import { useState, useEffect, useMemo } from "react";
import type { Quiz, QuizItem } from "@/src/types/quiz";
import { QuestionView } from "./QuestionView";
import { ActionButton } from "./ActionButton";
import { useLocale, LocaleOverrideProvider, type Locale } from "@/src/i18n";
import { routes } from "@/src/routes";

interface PersistedQuizState {
  seed: number;
  quizHash: string;
  results: boolean[];
  answers: unknown[];
}

const STORAGE_PREFIX = "quizlang-quiz-";

export function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function djb2Hash(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
  }
  return (hash >>> 0).toString(36);
}

function generateSeed(): number {
  return Math.floor(Math.random() * 2 ** 32);
}

function loadQuizState(quizId: string): PersistedQuizState | null {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + quizId);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedQuizState;
  } catch {
    return null;
  }
}

function saveQuizState(quizId: string, state: PersistedQuizState): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + quizId, JSON.stringify(state));
  } catch {}
}

function clearQuizState(quizId: string): void {
  try {
    localStorage.removeItem(STORAGE_PREFIX + quizId);
  } catch {}
}

function collectQuestions(items: QuizItem[]): QuizItem[] {
  return items.filter((item) => item.question);
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
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

  let questions = collectQuestions(quiz.items);
  if (shouldShuffleQuestions) questions = shuffle(questions, rng);

  return questions.map((item) => {
    const meta = item.metadata as Record<string, unknown> | undefined;
    const shouldShuffle =
      (meta?.shuffle_answers as boolean) ?? globalShuffleAnswers;
    return shouldShuffle ? shuffleAnswers(item, rng) : item;
  });
}

export const QuizPlayer: React.FC<{ quizId: string; quiz: Quiz }> = ({
  quizId,
  quiz,
}) => {
  const frontmatterLocale = (quiz.frontmatter as any)?.language as
    | Locale
    | undefined;

  return (
    <LocaleOverrideProvider value={frontmatterLocale ?? null}>
      <QuizPlayerInner quiz={quiz} quizId={quizId} />
    </LocaleOverrideProvider>
  );
};

function QuizPlayerInner({ quiz, quizId }: { quiz: Quiz; quizId: string }) {
  const quizHash = useMemo(() => djb2Hash(JSON.stringify(quiz)), [quiz]);

  const quizName = (quiz.frontmatter as any)?.name ?? quizId;

  const [seed, setSeed] = useState<number>(() => {
    const stored = loadQuizState(quizId);
    if (stored && stored.quizHash === quizHash) return stored.seed;
    return generateSeed();
  });

  const [results, setResults] = useState<boolean[]>(() => {
    const stored = loadQuizState(quizId);
    if (stored && stored.quizHash === quizHash) return stored.results;
    return [];
  });

  const [answers, setAnswers] = useState<unknown[]>(() => {
    const stored = loadQuizState(quizId);
    if (stored && stored.quizHash === quizHash) return stored.answers ?? [];
    return [];
  });

  const [current, setCurrent] = useState(() => {
    const stored = loadQuizState(quizId);
    if (stored && stored.quizHash === quizHash) return stored.results.length;
    return 0;
  });

  const [currentCorrect, setCurrentCorrect] = useState<boolean | null>(null);
  const [firstAttemptCorrect, setFirstAttemptCorrect] = useState<
    boolean | null
  >(null);
  const [currentAnswer, setCurrentAnswer] = useState<unknown>(null);

  const { t } = useLocale();

  const questions = useMemo(() => prepareQuestions(quiz, seed), [quiz, seed]);

  const total = questions.length;
  const finished = current >= total;
  const isReviewing = current < results.length;

  useEffect(() => {
    saveQuizState(quizId, { seed, quizHash, results, answers });
  }, [quizId, seed, quizHash, results, answers]);

  const handleReset = () => {
    clearQuizState(quizId);
    setSeed(generateSeed());
    setResults([]);
    setAnswers([]);
    setCurrent(0);
    setCurrentCorrect(null);
    setFirstAttemptCorrect(null);
    setCurrentAnswer(null);
  };

  if (finished) {
    return (
      <QuizFinishedStep
        results={results}
        quizName={quizName}
        questions={questions}
        onReset={handleReset}
        onBack={() => setCurrent((c) => c - 1)}
      />
    );
  }

  const question = questions[current];

  const handleAnswer = (correct: boolean, answer: unknown) => {
    if (firstAttemptCorrect === null) {
      setFirstAttemptCorrect(correct);
    }
    setCurrentCorrect(correct);
    setCurrentAnswer(answer);
  };

  const handleNext = () => {
    if (isReviewing) {
      setCurrent((c) => c + 1);
    } else {
      setResults((prev) => [...prev, firstAttemptCorrect!]);
      setAnswers((prev) => [...prev, currentAnswer]);
      setCurrent((c) => c + 1);
      setCurrentCorrect(null);
      setFirstAttemptCorrect(null);
      setCurrentAnswer(null);
    }
  };

  const handleBack = () => {
    if (!isReviewing) {
      setCurrentCorrect(null);
      setFirstAttemptCorrect(null);
    }
    setCurrent((c) => c - 1);
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
            {current + 1} / {total}
          </span>
        </div>
      </div>
      <div className="w-full h-1 bg-bg-2 rounded-full mb-2">
        <div
          className="h-1 bg-accent rounded-full transition-all"
          style={{ width: `${((current + 1) / total) * 100}%` }}
        />
      </div>
      {current > 0 && (
        <button
          onClick={handleBack}
          className="text-sm text-text-muted hover:text-accent transition-colors cursor-pointer mb-2"
        >
          ← {t("goBack")}
        </button>
      )}
      <div className="bg-bg-1 border border-border rounded-lg p-4 sm:p-6">
        <QuestionView
          key={isReviewing ? `review-${current}` : `${seed}-${current}`}
          item={question}
          onAnswer={handleAnswer}
          seed={seed ^ (current + 1)}
          reviewAnswer={isReviewing ? answers[current] : undefined}
        />
        {!isReviewing && currentCorrect === false && (
          <p className="text-sm text-incorrect mt-4 sm:mt-6">
            {t("wrongTryAgain")}
          </p>
        )}
        {(isReviewing || currentCorrect === true) && (
          <div className="mt-4 sm:mt-6">
            <ActionButton onClick={handleNext}>
              {!isReviewing && current + 1 >= total
                ? t("seeResults")
                : t("next")}
            </ActionButton>
          </div>
        )}
      </div>
    </div>
  );
}

const QuizFinishedStep: React.FC<{
  results: boolean[];
  questions: QuizItem[];
  quizName: string;
  onReset: () => void;
  onBack: () => void;
}> = ({ results, questions, quizName, onReset, onBack }) => {
  const { t } = useLocale();

  const score = results.filter(Boolean).length;
  const total = questions.length;
  const incorrectIndices = results
    .map((correct, i) => (correct ? -1 : i))
    .filter((i) => i >= 0);

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
          <ActionButton onClick={onReset}>{t("tryAgain")}</ActionButton>
          <a
            href={routes.index}
            className="px-5 sm:px-6 py-2 bg-bg-2 text-text-primary font-semibold rounded-lg border border-border hover:border-accent transition-colors"
          >
            {t("allQuizzes")}
          </a>
        </div>
        <button
          onClick={onBack}
          className="text-sm text-text-muted hover:text-accent transition-colors cursor-pointer mt-4"
        >
          ← {t("goBack")}
        </button>
      </div>
    </div>
  );
};
