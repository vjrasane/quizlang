import type { Section } from "@/src/types/quiz";
import { SingleChoice } from "./SingleChoice";
import { MultiChoice } from "./MultiChoice";
import { FreeInput } from "./FreeInput";
import { Categorize } from "./Categorize";

interface Props {
  section: Section;
  onAnswer: (correct: boolean) => void;
}

export function QuestionView({ section, onAnswer }: Props) {
  const { question } = section;
  if (!question) return null;

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold text-text-primary">
        {section.header}
      </h2>
      {section.text && (
        <p className="text-text-secondary text-sm">{section.text}</p>
      )}
      {question.type === "SingleChoice" && (
        <SingleChoice answers={question.answers} onAnswer={onAnswer} />
      )}
      {question.type === "MultiChoice" && (
        <MultiChoice answers={question.answers} onAnswer={onAnswer} />
      )}
      {question.type === "FreeInput" && (
        <FreeInput answer={question.answer} onAnswer={onAnswer} />
      )}
      {question.type === "Categorize" && (
        <Categorize categories={question.categories} onAnswer={onAnswer} />
      )}
    </div>
  );
}
