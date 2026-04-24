import type { QuizItem, AnswerState } from "@/src/types/quiz";
import { SingleChoice } from "./SingleChoice";
import { MultiChoice } from "./MultiChoice";
import { FreeInput } from "./FreeInput";
import { Categorize } from "./Categorize";
import { Sorting } from "./Sorting";
import { Matching } from "./Matching";

interface Props {
  item: QuizItem;
  onAnswer: (answer: AnswerState) => void;
  seed?: number;
  reviewAnswer?: AnswerState;
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
          onAnswer={(correct, value) =>
            onAnswer({ type: "SingleChoice", value, correct })
          }
          reviewAnswer={
            reviewAnswer?.type === "SingleChoice"
              ? reviewAnswer.value
              : undefined
          }
        />
      )}
      {question.type === "MultiChoice" && (
        <MultiChoice
          answers={question.answers}
          onAnswer={(correct, value) =>
            onAnswer({ type: "MultiChoice", value, correct })
          }
          reviewAnswer={
            reviewAnswer?.type === "MultiChoice"
              ? reviewAnswer.value
              : undefined
          }
        />
      )}
      {question.type === "FreeInput" && (
        <FreeInput
          answer={question.answer}
          onAnswer={(correct, value) =>
            onAnswer({ type: "FreeInput", value, correct })
          }
          reviewAnswer={
            reviewAnswer?.type === "FreeInput"
              ? reviewAnswer.value
              : undefined
          }
        />
      )}
      {question.type === "Categorize" && (
        <Categorize
          categories={question.categories}
          onAnswer={(correct, value) =>
            onAnswer({ type: "Categorize", value, correct })
          }
          seed={seed}
          reviewAnswer={
            reviewAnswer?.type === "Categorize"
              ? reviewAnswer.value
              : undefined
          }
        />
      )}
      {question.type === "Sorting" && (
        <Sorting
          items={question.items}
          onAnswer={(correct, value) =>
            onAnswer({ type: "Sorting", value, correct })
          }
          seed={seed}
          reviewAnswer={
            reviewAnswer?.type === "Sorting"
              ? reviewAnswer.value
              : undefined
          }
        />
      )}
      {question.type === "Matching" && (
        <Matching
          pairs={question.pairs}
          onAnswer={(correct, value) =>
            onAnswer({ type: "Matching", value, correct })
          }
          seed={seed}
          reviewAnswer={
            reviewAnswer?.type === "Matching"
              ? reviewAnswer.value
              : undefined
          }
        />
      )}
    </div>
  );
}
