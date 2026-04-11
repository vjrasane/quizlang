import { useState } from "react";
import type { Answer } from "@/src/types/quiz";
import { useLocale } from "@/src/i18n";

interface Props {
  answers: Answer[];
  onAnswer: (correct: boolean) => void;
}

export function MultiChoice({ answers, onAnswer }: Props) {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const { t } = useLocale();

  const toggleSelection = (index: number) => {
    if (submitted) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const handleSubmit = () => {
    setSubmitted(true);
    const allCorrect = answers.every(
      (a, i) => a.correct === selected.has(i),
    );
    onAnswer(allCorrect);
  };

  return (
    <div className="flex flex-col gap-2">
      {answers.map((answer, i) => {
        let style = selected.has(i)
          ? "bg-selected-bg border-selected"
          : "bg-bg-2 border-border hover:border-accent";

        if (submitted) {
          if (answer.correct && selected.has(i))
            style = "bg-correct-bg border-correct";
          else if (answer.correct && !selected.has(i))
            style = "bg-correct-bg border-correct opacity-60";
          else if (!answer.correct && selected.has(i))
            style = "bg-incorrect-bg border-incorrect";
          else style = "bg-bg-2 border-border opacity-50";
        }

        return (
          <button
            key={i}
            onClick={() => toggleSelection(i)}
            disabled={submitted}
            className={`w-full text-left px-3 sm:px-4 py-3 rounded-lg border transition-colors ${style} ${!submitted ? "cursor-pointer" : "cursor-default"}`}
          >
            <span className="text-sm sm:text-base text-text-primary">{answer.text}</span>
            {submitted && answer.notes && (
              <p className="text-sm text-text-muted mt-1">{answer.notes}</p>
            )}
          </button>
        );
      })}
      {!submitted && (
        <button
          onClick={handleSubmit}
          disabled={selected.size === 0}
          className="mt-2 w-full sm:w-auto px-6 py-2.5 sm:py-2 bg-accent text-bg-0 font-semibold rounded-lg hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {t("submit")}
        </button>
      )}
    </div>
  );
}
