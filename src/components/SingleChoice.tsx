import { useState } from "react";
import type { Answer } from "@/src/types/quiz";

interface Props {
  answers: Answer[];
  onAnswer: (correct: boolean, value: number) => void;
  reviewAnswer?: number;
}

export function SingleChoice({ answers, onAnswer, reviewAnswer }: Props) {
  const readOnly = reviewAnswer !== undefined;
  const [selected, setSelected] = useState<number | null>(reviewAnswer ?? null);
  const [locked, setLocked] = useState(readOnly);

  const handleSelect = (index: number) => {
    if (locked) return;
    setSelected(index);
    const correct = answers[index].correct;
    if (correct) setLocked(true);
    onAnswer(correct, index);
  };

  return (
    <div className="flex flex-col gap-2">
      {answers.map((answer, i) => {
        let style = "bg-bg-2 border-border hover:border-accent";
        if (i === selected) {
          style = answer.correct
            ? "bg-correct-bg border-correct"
            : "bg-incorrect-bg border-incorrect";
        } else if (locked) {
          style = "bg-bg-2 border-border opacity-50";
        }

        return (
          <button
            key={i}
            onClick={() => handleSelect(i)}
            disabled={locked}
            className={`w-full text-left px-3 sm:px-4 py-3 rounded-lg border transition-colors ${style} ${locked ? "cursor-default" : "cursor-pointer"}`}
          >
            <span className="text-sm sm:text-base text-text-primary">{answer.text}</span>
            {i === selected && answer.notes && (
              <p className="text-sm text-text-muted mt-2 px-2.5 py-1.5 rounded border border-black/15 bg-black/5">{answer.notes}</p>
            )}
          </button>
        );
      })}
    </div>
  );
}
