import type { QuizItem } from "@/src/types/quiz";
import { SingleChoice } from "./SingleChoice";
import { MultiChoice } from "./MultiChoice";
import { FreeInput } from "./FreeInput";
import { Categorize } from "./Categorize";
import { Sorting } from "./Sorting";
import { Matching } from "./Matching";
interface Props {
  item: QuizItem;
  onAnswer: (correct: boolean, answer: unknown) => void;
  seed?: number;
  reviewAnswer?: unknown;
}

export function QuestionView({ item, onAnswer, seed, reviewAnswer }: Props) {
  const { question, body } = item;

  return (
    <div className="flex flex-col gap-4">
      {body && (
        <div
          className="quiz-body"
          dangerouslySetInnerHTML={{ __html: body }}
        />
      )}
      {question.type === "SingleChoice" && (
        <SingleChoice
          answers={question.answers}
          onAnswer={onAnswer}
          reviewAnswer={reviewAnswer as number | undefined}
        />
      )}
      {question.type === "MultiChoice" && (
        <MultiChoice
          answers={question.answers}
          onAnswer={onAnswer}
          reviewAnswer={reviewAnswer as number[] | undefined}
        />
      )}
      {question.type === "FreeInput" && (
        <FreeInput
          answer={question.answer}
          onAnswer={onAnswer}
          reviewAnswer={reviewAnswer as string | undefined}
        />
      )}
      {question.type === "Categorize" && (
        <Categorize
          categories={question.categories}
          onAnswer={onAnswer}
          seed={seed}
          reviewAnswer={
            reviewAnswer as Record<number, number | null> | undefined
          }
        />
      )}
      {question.type === "Sorting" && (
        <Sorting
          items={question.items}
          onAnswer={onAnswer}
          seed={seed}
          reviewAnswer={reviewAnswer as number[] | undefined}
        />
      )}
      {question.type === "Matching" && (
        <Matching
          pairs={question.pairs}
          onAnswer={onAnswer}
          seed={seed}
          reviewAnswer={
            reviewAnswer as Record<number, number | null> | undefined
          }
        />
      )}
    </div>
  );
}
