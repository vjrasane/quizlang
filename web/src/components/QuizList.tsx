import { useLocale } from "@/src/i18n";

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

export function QuizList({ quizzes }: Props) {
  const { t } = useLocale();

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">
        {t("quizzes")}
      </h1>
      <div className="grid gap-3 sm:gap-4">
        {quizzes.map((q) => (
          <a
            key={q.id}
            href={`${import.meta.env.BASE_URL}/play/${q.id}`}
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
              <span className="text-sm text-text-muted whitespace-nowrap">
                {t("nQuestions", { n: q.questionCount })}
              </span>
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
