import type { Section } from "@/src/types/quiz";
import { SingleChoice } from "./SingleChoice";
import { MultiChoice } from "./MultiChoice";
import { FreeInput } from "./FreeInput";
import { Categorize } from "./Categorize";
import { routes } from "@/src/routes";

interface Props {
  section: Section;
  onAnswer: (correct: boolean) => void;
  seed?: number;
  displayCorrect?: boolean;
}

export function QuestionView({ section, onAnswer, seed, displayCorrect = true }: Props) {
  const { question } = section;
  if (!question) return null;

  const image = (section.metadata as Record<string, unknown> | undefined)
    ?.image as string | undefined;

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg sm:text-xl font-semibold text-text-primary">
        {section.header}
      </h2>
      {section.text && (
        <p className="text-text-secondary text-sm">{section.text}</p>
      )}
      {image && (
        <img
          src={`${routes.base}/${image}`}
          alt={section.header}
          className="rounded-lg max-h-64 object-contain self-center"
        />
      )}
      {question.type === "SingleChoice" && (
        <SingleChoice answers={question.answers} onAnswer={onAnswer} displayCorrect={displayCorrect} />
      )}
      {question.type === "MultiChoice" && (
        <MultiChoice answers={question.answers} onAnswer={onAnswer} displayCorrect={displayCorrect} />
      )}
      {question.type === "FreeInput" && (
        <FreeInput answer={question.answer} onAnswer={onAnswer} displayCorrect={displayCorrect} />
      )}
      {question.type === "Categorize" && (
        <Categorize categories={question.categories} onAnswer={onAnswer} seed={seed} displayCorrect={displayCorrect} />
      )}
    </div>
  );
}
