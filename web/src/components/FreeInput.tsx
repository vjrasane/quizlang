import { useState } from "react";
import type { Answer } from "@/src/types/quiz";
import { useLocale } from "@/src/i18n";
import { ActionButton } from "./ActionButton";

interface Props {
  answer: Answer;
  onAnswer: (correct: boolean) => void;
  displayCorrect?: boolean;
}

export function FreeInput({ answer, onAnswer, displayCorrect = true }: Props) {
  const [value, setValue] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const { t } = useLocale();

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

  const inputStyle = submitted && displayCorrect
    ? isCorrect
      ? "border-correct bg-correct-bg"
      : "border-incorrect bg-incorrect-bg"
    : submitted
      ? "border-selected bg-selected-bg"
      : "border-border";

  return (
    <div className="flex flex-col gap-3">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={submitted}
        placeholder={t("typeYourAnswer")}
        className={`w-full px-3 sm:px-4 py-3 rounded-lg border bg-bg-2 text-sm sm:text-base text-text-primary placeholder:text-text-muted outline-none focus:border-accent focus:ring-1 focus:ring-accent ${inputStyle}`}
      />
      {submitted && displayCorrect && !isCorrect && (
        <p className="text-sm text-correct">
          {t("correctAnswer")} {answer.text}
        </p>
      )}
      {submitted && answer.notes && (
        <p className="text-sm text-text-muted px-2.5 py-1.5 rounded border border-black/15 bg-black/5">{answer.notes}</p>
      )}
      {!submitted && (
        <ActionButton onClick={handleSubmit} disabled={!value.trim()}>
          {t("submit")}
        </ActionButton>
      )}
    </div>
  );
}
