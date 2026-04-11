import { useState } from "react";
import type { Answer } from "@/src/types/quiz";

interface Props {
  answer: Answer;
  onAnswer: (correct: boolean) => void;
}

export function FreeInput({ answer, onAnswer }: Props) {
  const [value, setValue] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const isCorrect =
    value.trim().toLowerCase() === answer.text.trim().toLowerCase();

  const handleSubmit = () => {
    if (!value.trim()) return;
    setSubmitted(true);
    onAnswer(isCorrect);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !submitted) handleSubmit();
  };

  return (
    <div className="flex flex-col gap-3">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={submitted}
        placeholder="Type your answer..."
        className={`w-full px-3 sm:px-4 py-3 rounded-lg border bg-bg-2 text-sm sm:text-base text-text-primary placeholder:text-text-muted outline-none focus:border-accent focus:ring-1 focus:ring-accent ${
          submitted
            ? isCorrect
              ? "border-correct bg-correct-bg"
              : "border-incorrect bg-incorrect-bg"
            : "border-border"
        }`}
      />
      {submitted && !isCorrect && (
        <p className="text-sm text-correct">
          Correct answer: {answer.text}
        </p>
      )}
      {submitted && answer.notes && (
        <p className="text-sm text-text-muted">{answer.notes}</p>
      )}
      {!submitted && (
        <button
          onClick={handleSubmit}
          disabled={!value.trim()}
          className="w-full sm:w-auto px-6 py-2.5 sm:py-2 bg-accent text-bg-0 font-semibold rounded-lg hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Submit
        </button>
      )}
    </div>
  );
}
