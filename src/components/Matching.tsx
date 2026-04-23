import { useState, useMemo } from "react";
import type { MatchPair } from "@/src/types/quiz";
import { useLocale } from "@/src/i18n";
import { ActionButton } from "./ActionButton";
import { mulberry32 } from "../utils";

interface Props {
  pairs: MatchPair[];
  onAnswer: (correct: boolean, answer: unknown) => void;
  seed?: number;
  reviewAnswer?: Record<number, number | null>;
}

export function Matching({ pairs, onAnswer, seed, reviewAnswer }: Props) {
  const { t } = useLocale();
  const readOnly = reviewAnswer !== undefined;

  const shuffledLeft = useMemo(() => {
    const indices = pairs.map((_, i) => i);
    const rng = seed != null ? mulberry32(seed) : Math.random;
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    return indices;
  }, [pairs, seed]);

  const shuffledRight = useMemo(() => {
    const indices = pairs.map((_, i) => i);
    const rng = seed != null ? mulberry32(seed + 1) : Math.random;
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    return indices;
  }, [pairs, seed]);

  // maps leftIdx → rightIdx
  const [assignments, setAssignments] = useState<Record<number, number>>(
    () => (reviewAnswer as Record<number, number>) ?? {},
  );
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [selectedRight, setSelectedRight] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(readOnly);
  const [locked, setLocked] = useState(readOnly);

  const assignedLefts = new Set(Object.keys(assignments).map(Number));
  const assignedRights = new Set(Object.values(assignments));

  const unassignedLeft = shuffledLeft.filter((i) => !assignedLefts.has(i));
  const unassignedRight = shuffledRight.filter((i) => !assignedRights.has(i));
  const allAssigned = Object.keys(assignments).length === pairs.length;

  const matchedPairs = Object.entries(assignments).map(([l, r]) => ({
    leftIdx: Number(l),
    rightIdx: r,
  }));

  const tryMatch = (leftIdx: number, rightIdx: number) => {
    setAssignments((prev) => {
      const next = { ...prev };
      // Remove leftIdx from any existing pair
      delete next[leftIdx];
      // Remove rightIdx from any existing pair
      const existingLeft = Object.entries(next).find(([, r]) => r === rightIdx);
      if (existingLeft) delete next[Number(existingLeft[0])];
      // Create new pair
      next[leftIdx] = rightIdx;
      return next;
    });
    setSelectedLeft(null);
    setSelectedRight(null);
  };

  const handleTapLeft = (idx: number) => {
    if (locked) return;
    if (selectedRight !== null) {
      tryMatch(idx, selectedRight);
    } else {
      setSelectedLeft((prev) => (prev === idx ? null : idx));
      setSelectedRight(null);
    }
  };

  const handleTapRight = (idx: number) => {
    if (locked) return;
    if (selectedLeft !== null) {
      tryMatch(selectedLeft, idx);
    } else {
      setSelectedRight((prev) => (prev === idx ? null : idx));
      setSelectedLeft(null);
    }
  };

  const handleSubmit = () => {
    setSubmitted(true);
    const allCorrect = Object.entries(assignments).every(
      ([leftIdx, rightIdx]) => Number(leftIdx) === rightIdx,
    );
    if (allCorrect) setLocked(true);
    onAnswer(allCorrect, { ...assignments });
  };

  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      {/* Matched pairs */}
      {matchedPairs.length > 0 && (
        <div className="flex flex-col gap-2">
          {matchedPairs.map(({ leftIdx, rightIdx }) => {
            if (submitted) {
              const correct = leftIdx === rightIdx;
              const itemStyle = correct
                ? "bg-correct-bg text-correct border-correct"
                : "bg-incorrect-bg text-incorrect border-incorrect";
              return (
                <div
                  key={leftIdx}
                  className="flex flex-col gap-1.5 rounded-lg border border-dashed border-border p-0.5"
                >
                  <div className="flex gap-2">
                    <div
                      className={`flex-1 px-3 sm:px-4 py-3 rounded-lg border text-sm sm:text-base ${itemStyle}`}
                    >
                      {pairs[leftIdx].left}
                    </div>
                    <div
                      className={`flex-1 px-3 sm:px-4 py-3 rounded-lg border text-sm sm:text-base ${itemStyle}`}
                    >
                      {pairs[rightIdx].right}
                    </div>
                  </div>
                  {!correct && pairs[leftIdx].notes && (
                    <p className="text-xs opacity-75 px-2 py-1 rounded border border-black/15 bg-black/5">
                      {pairs[leftIdx].notes}
                    </p>
                  )}
                </div>
              );
            }
            return (
              <div
                key={leftIdx}
                className="flex gap-2 rounded-lg border border-dashed border-border p-0.5"
              >
                <button
                  onClick={() => handleTapLeft(leftIdx)}
                  className={`flex-1 px-3 sm:px-4 py-3 rounded-lg border text-sm sm:text-base text-text-primary text-left transition-colors cursor-pointer ${
                    selectedLeft === leftIdx
                      ? "bg-bg-2 border-accent"
                      : "bg-bg-2 border-border"
                  }`}
                >
                  {pairs[leftIdx].left}
                </button>
                <button
                  onClick={() => handleTapRight(rightIdx)}
                  className={`flex-1 px-3 sm:px-4 py-3 rounded-lg border text-sm sm:text-base text-text-primary text-left transition-colors cursor-pointer ${
                    selectedRight === rightIdx
                      ? "bg-bg-2 border-accent"
                      : "bg-bg-2 border-border"
                  }`}
                >
                  {pairs[rightIdx].right}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Unmatched columns */}
      {!submitted &&
        (unassignedLeft.length > 0 || unassignedRight.length > 0) && (
          <div className="flex gap-3 items-start">
            <div className="flex flex-col gap-2 flex-1">
              {unassignedLeft.map((i) => (
                <button
                  key={i}
                  onClick={() => handleTapLeft(i)}
                  className={`w-full text-left px-3 sm:px-4 py-3 rounded-lg border text-sm sm:text-base text-text-primary transition-colors ${
                    selectedLeft === i
                      ? "bg-bg-2 border-accent"
                      : "bg-bg-2 border-border"
                  } ${locked ? "cursor-default" : "cursor-pointer"}`}
                >
                  {pairs[i].left}
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-2 flex-1">
              {unassignedRight.map((i) => (
                <button
                  key={i}
                  onClick={() => handleTapRight(i)}
                  className={`w-full text-left px-3 sm:px-4 py-3 rounded-lg border text-sm sm:text-base text-text-primary transition-colors ${
                    selectedRight === i
                      ? "bg-bg-2 border-accent"
                      : "bg-bg-2 border-border"
                  } ${locked ? "cursor-default" : "cursor-pointer"}`}
                >
                  {pairs[i].right}
                </button>
              ))}
            </div>
          </div>
        )}

      {!submitted && !locked && (
        <ActionButton onClick={handleSubmit} disabled={!allAssigned}>
          {t("submit")}
        </ActionButton>
      )}
      {submitted && !locked && (
        <ActionButton onClick={() => setSubmitted(false)}>
          {t("tryAgain")}
        </ActionButton>
      )}
    </div>
  );
}
