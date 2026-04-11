import { useState, useEffect, useMemo } from "react";
import type { Quiz, Section } from "@/src/types/quiz";
import { QuestionView } from "./QuestionView";
import { ActionButton } from "./ActionButton";
import { useLocale, LocaleOverrideProvider, type Locale } from "@/src/i18n";
import { routes } from "@/src/routes";

interface Props {
  quizId: string;
  initialQuiz?: Quiz;
}

function collectQuestions(sections: Section[]): Section[] {
  const result: Section[] = [];
  for (const section of sections) {
    if (section.question) result.push(section);
    if (section.items.length > 0) result.push(...collectQuestions(section.items));
  }
  return result;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function shuffleAnswers(section: Section): Section {
  const q = section.question;
  if (!q) return section;
  switch (q.type) {
    case "SingleChoice":
    case "MultiChoice":
      return { ...section, question: { ...q, answers: shuffle(q.answers) } };
    case "Categorize":
      return {
        ...section,
        question: {
          ...q,
          categories: q.categories.map((c) => ({
            ...c,
            answers: shuffle(c.answers),
          })),
        },
      };
    default:
      return section;
  }
}

function prepareQuestions(
  quiz: Quiz,
): Section[] {
  const fm = quiz.frontmatter as Record<string, unknown> | undefined;
  const shouldShuffleQuestions = (fm?.shuffle_questions as boolean) ?? false;
  const globalShuffleAnswers = (fm?.shuffle_answers as boolean) ?? true;

  let questions = collectQuestions(quiz.items);
  if (shouldShuffleQuestions) questions = shuffle(questions);

  return questions.map((section) => {
    const meta = section.metadata as Record<string, unknown> | undefined;
    const shouldShuffle = (meta?.shuffle_answers as boolean) ?? globalShuffleAnswers;
    return shouldShuffle ? shuffleAnswers(section) : section;
  });
}

export function QuizPlayer({ quizId, initialQuiz }: Props) {
  const [quiz, setQuiz] = useState<Quiz | null>(initialQuiz ?? null);

  useEffect(() => {
    if (initialQuiz) return;
    fetch(`${routes.play(quizId)}.json`)
      .then((r) => r.json())
      .then(setQuiz);
  }, [quizId, initialQuiz]);

  const frontmatterLocale = (quiz?.frontmatter as any)?.language as
    | Locale
    | undefined;

  if (!quiz) {
    return (
      <div className="text-text-muted">
        <LoadingMessage />
      </div>
    );
  }

  return (
    <LocaleOverrideProvider value={frontmatterLocale ?? null}>
      <QuizPlayerInner quiz={quiz} quizId={quizId} />
    </LocaleOverrideProvider>
  );
}

function LoadingMessage() {
  const { t } = useLocale();
  return <>{t("loading")}</>;
}

function QuizPlayerInner({ quiz, quizId }: { quiz: Quiz; quizId: string }) {
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [finished, setFinished] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const { t } = useLocale();

  const questions = useMemo(
    () => prepareQuestions(quiz),
    [quiz, attempt],
  );

  const name = (quiz.frontmatter as any)?.name ?? quizId;
  const total = questions.length;

  if (finished) {
    return (
      <div>
        <div className="bg-bg-1 border border-border rounded-lg p-6 sm:p-8 text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-text-primary mb-2">
            {name}
          </h2>
          <p className="text-3xl sm:text-4xl font-bold text-accent mb-2">
            {score} / {total}
          </p>
          <p className="text-text-secondary mb-4 sm:mb-6">
            {Math.round((score / total) * 100)}
            {t("percentCorrect")}
          </p>
          <div className="flex gap-3 justify-center">
            <ActionButton
              onClick={() => {
                setCurrent(0);
                setScore(0);
                setAnswered(false);
                setFinished(false);
                setAttempt((a) => a + 1);
              }}
            >
              {t("tryAgain")}
            </ActionButton>
            <a
              href={routes.index}
              className="px-5 sm:px-6 py-2 bg-bg-2 text-text-primary font-semibold rounded-lg border border-border hover:border-accent transition-colors"
            >
              {t("allQuizzes")}
            </a>
          </div>
        </div>
      </div>
    );
  }

  const question = questions[current];

  const handleAnswer = (correct: boolean) => {
    if (correct) setScore((s) => s + 1);
    setAnswered(true);
  };

  const handleNext = () => {
    if (current + 1 >= total) {
      setFinished(true);
    } else {
      setCurrent((c) => c + 1);
      setAnswered(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-base sm:text-lg font-semibold text-text-secondary truncate mr-2">
          {name}
        </h1>
        <span className="text-sm text-text-muted whitespace-nowrap">
          {current + 1} / {total}
        </span>
      </div>
      <div className="w-full h-1 bg-bg-2 rounded-full mb-4 sm:mb-6">
        <div
          className="h-1 bg-accent rounded-full transition-all"
          style={{ width: `${((current + 1) / total) * 100}%` }}
        />
      </div>
      <div className="bg-bg-1 border border-border rounded-lg p-4 sm:p-6">
        <QuestionView
          key={current}
          section={question}
          onAnswer={handleAnswer}
        />
        {answered && (
          <ActionButton onClick={handleNext} className="mt-4 sm:mt-6">
            {current + 1 >= total ? t("seeResults") : t("next")}
          </ActionButton>
        )}
      </div>
    </div>
  );
}
