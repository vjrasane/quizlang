import { useState, useEffect } from "react";
import { useLocale } from "@/src/i18n";
import { routes } from "@/src/routes";

interface QuizEntry {
  id: string;
  name: string;
  category?: string;
  tags: string[];
  questionCount: number;
}

interface Props {
  quizzes: QuizEntry[];
}

interface PersistedQuizState {
  seed: number;
  quizHash: string;
  results: boolean[];
}

const STORAGE_PREFIX = "quizlang-quiz-";

function loadQuizState(quizId: string): PersistedQuizState | null {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + quizId);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedQuizState;
  } catch {
    return null;
  }
}

function QuizStatus({
  quizId,
  questionCount,
}: {
  quizId: string;
  questionCount: number;
}) {
  const { t } = useLocale();
  const [state, setState] = useState<PersistedQuizState | null>(null);

  useEffect(() => {
    setState(loadQuizState(quizId));
  }, [quizId]);

  if (!state || state.results.length === 0) {
    return (
      <span className="text-sm text-text-muted whitespace-nowrap">
        {t("nQuestions", { n: questionCount })}
      </span>
    );
  }

  const answered = state.results.length;
  const finished = answered >= questionCount;

  if (finished) {
    const score = state.results.filter(Boolean).length;
    return (
      <span className="text-sm text-correct font-medium whitespace-nowrap">
        {score} / {questionCount}
      </span>
    );
  }

  return (
    <span className="text-sm text-accent font-medium whitespace-nowrap">
      {answered} / {questionCount}
    </span>
  );
}

export function QuizList({ quizzes }: Props) {
  const { t } = useLocale();

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">
        {t("quizzes")}
      </h1>
      <div className="grid gap-3 sm:gap-4">
        {quizzes.map((q) => (
          <a
            key={q.id}
            href={routes.play(q.id)}
            className="block bg-bg-1 border border-border rounded-lg p-4 sm:p-5 hover:border-accent transition-colors"
          >
            <div className="flex items-start justify-between gap-3 sm:gap-4">
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-text-primary">
                  {q.name}
                </h2>
                {q.category && (
                  <span className="text-sm text-text-muted">{q.category}</span>
                )}
              </div>
              <QuizStatus quizId={q.id} questionCount={q.questionCount} />
            </div>
            {q.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {q.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs bg-bg-2 text-text-secondary px-2 py-0.5 rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </a>
        ))}
      </div>
    </div>
  );
}
