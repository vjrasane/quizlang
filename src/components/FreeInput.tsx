import { useState } from "react";
import type { Answer } from "@/src/types/quiz";
import { useLocale } from "@/src/i18n";
import { ActionButton } from "./ActionButton";

interface Props {
  answer: Answer;
  onAnswer: (correct: boolean, value: string) => void;
  reviewAnswer?: string;
}

export function FreeInput({ answer, onAnswer, reviewAnswer }: Props) {
  const readOnly = reviewAnswer !== undefined;
  const [value, setValue] = useState(reviewAnswer ?? "");
  const [submitted, setSubmitted] = useState(readOnly);
  const [locked, setLocked] = useState(readOnly);
  const { t } = useLocale();

  const isCorrect =
    value.trim().toLowerCase() === answer.text.trim().toLowerCase();

  const handleSubmit = () => {
    if (!value.trim()) return;
    setSubmitted(true);
    if (isCorrect) setLocked(true);
    onAnswer(isCorrect, value.trim());
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    if (submitted && !locked) setSubmitted(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !locked) handleSubmit();
  };

  const inputStyle = submitted
    ? isCorrect
      ? "border-correct bg-correct-bg"
      : "border-incorrect bg-incorrect-bg"
    : "border-border";

  return (
    <div className="flex flex-col gap-3">
      <input
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        disabled={locked}
        placeholder={t("typeYourAnswer")}
        className={`w-full px-3 sm:px-4 py-3 rounded-lg border bg-bg-2 text-sm sm:text-base text-text-primary placeholder:text-text-muted outline-none focus:border-accent focus:ring-1 focus:ring-accent ${inputStyle}`}
      />
      {submitted && answer.notes && (
        <p className="text-sm text-text-muted px-2.5 py-1.5 rounded border border-black/15 bg-black/5">{answer.notes}</p>
      )}
      {!locked && (
        <ActionButton onClick={handleSubmit} disabled={!value.trim()}>
          {t("submit")}
        </ActionButton>
      )}
    </div>
  );
}
