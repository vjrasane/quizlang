import { useState } from "react";
import type { Answer } from "@/src/types/quiz";

interface Props {
  answers: Answer[];
  onAnswer: (correct: boolean) => void;
  displayCorrect?: boolean;
}

export function SingleChoice({ answers, onAnswer, displayCorrect = true }: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const answered = selected !== null;

  const handleSelect = (index: number) => {
    if (answered) return;
    setSelected(index);
    onAnswer(answers[index].correct);
  };

  return (
    <div className="flex flex-col gap-2">
      {answers.map((answer, i) => {
        let style = "bg-bg-2 border-border hover:border-accent";
        if (answered) {
          if (displayCorrect) {
            if (answer.correct) style = "bg-correct-bg border-correct";
            else if (i === selected) style = "bg-incorrect-bg border-incorrect";
            else style = "bg-bg-2 border-border opacity-50";
          } else {
            if (i === selected) style = "bg-selected-bg border-selected";
            else style = "bg-bg-2 border-border opacity-50";
          }
        }

        return (
          <button
            key={i}
            onClick={() => handleSelect(i)}
            disabled={answered}
            className={`w-full text-left px-3 sm:px-4 py-3 rounded-lg border transition-colors ${style} ${!answered ? "cursor-pointer" : "cursor-default"}`}
          >
            <span className="text-sm sm:text-base text-text-primary">{answer.text}</span>
            {answered && displayCorrect && answer.notes && (
              <p className="text-sm text-text-muted mt-1">{answer.notes}</p>
            )}
          </button>
        );
      })}
    </div>
  );
}
