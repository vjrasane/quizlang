import { useState } from "react";
import type { Answer } from "@/src/types/quiz";
import { useLocale } from "@/src/i18n";
import { ActionButton } from "./ActionButton";

interface Props {
  answers: Answer[];
  onAnswer: (correct: boolean, answer: unknown) => void;
  reviewAnswer?: number[];
}

export function MultiChoice({ answers, onAnswer, reviewAnswer }: Props) {
  const readOnly = reviewAnswer !== undefined;
  const [selected, setSelected] = useState<Set<number>>(
    () => new Set(reviewAnswer ?? []),
  );
  const [submitted, setSubmitted] = useState(readOnly);
  const [locked, setLocked] = useState(readOnly);
  const { t } = useLocale();

  const toggleSelection = (index: number) => {
    if (locked) return;
    if (submitted) setSubmitted(false);
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
    if (allCorrect) setLocked(true);
    onAnswer(allCorrect, [...selected]);
  };

  return (
    <div className="flex flex-col gap-2">
      {answers.map((answer, i) => {
        let style = selected.has(i)
          ? "bg-selected-bg border-selected"
          : "bg-bg-2 border-border hover:border-accent";

        if (submitted) {
          if (selected.has(i)) {
            style = answer.correct
              ? "bg-correct-bg border-correct"
              : "bg-incorrect-bg border-incorrect";
          } else {
            style = "bg-bg-2 border-border opacity-50";
          }
        }

        return (
          <button
            key={i}
            onClick={() => toggleSelection(i)}
            disabled={locked}
            className={`w-full text-left px-3 sm:px-4 py-3 rounded-lg border transition-colors ${style} ${locked ? "cursor-default" : "cursor-pointer"}`}
          >
            <span className="text-sm sm:text-base text-text-primary">{answer.text}</span>
            {submitted && selected.has(i) && answer.notes && (
              <p className="text-sm text-text-muted mt-2 px-2.5 py-1.5 rounded border border-black/15 bg-black/5">{answer.notes}</p>
            )}
          </button>
        );
      })}
      {!locked && (
        <ActionButton onClick={handleSubmit} disabled={selected.size === 0} className="mt-2">
          {t("submit")}
        </ActionButton>
      )}
    </div>
  );
}
