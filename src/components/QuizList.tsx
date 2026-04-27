import { useState, useEffect } from "react";
import { usePageLocale } from "@/src/i18n";
import { getScore, initQuizState, loadQuizState } from "../quiz-storage";
import type { QuizState } from "../types/quiz";
import { useRoutes } from "../routes";

interface QuizEntry {
  id: string;
  hash: string;
  name: string;
  category?: string;
  tags: string[];
  questionCount: number;
}

export const QuizList: React.FC<{
  quizzes: QuizEntry[];
}> = ({ quizzes }) => {
  const routes = useRoutes();
  const { t } = usePageLocale();
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
              <QuizStatus
                quizId={q.id}
                quizHash={q.hash}
                questionCount={q.questionCount}
              />
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
};

const QuizStatus: React.FC<{
  quizId: string;
  quizHash: string;
  questionCount: number;
}> = ({ quizId, quizHash, questionCount }) => {
  const { t } = usePageLocale();
  const [state, setState] = useState<QuizState>(initQuizState);

  useEffect(() => {
    const loaded = loadQuizState(quizId, quizHash);
    if (!loaded) return;
    setState(loaded);
  }, [quizId, quizHash]);

  if (!state.steps.length) {
    return (
      <span className="text-sm text-text-muted whitespace-nowrap">
        {t("nQuestions", { n: questionCount })}
      </span>
    );
  }

  const answered = state.steps.length;
  const finished = answered >= questionCount;

  if (finished) {
    const score = getScore(state);
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
};
