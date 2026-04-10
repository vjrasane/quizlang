import { useState, useEffect, useMemo } from "react";
import type { Quiz, Section } from "@/src/types/quiz";
import { QuestionView } from "./QuestionView";

interface Props {
  quizId: string;
}

function collectQuestions(sections: Section[]): Section[] {
  const result: Section[] = [];
  for (const section of sections) {
    if (section.question) result.push(section);
    if (section.items.length > 0) result.push(...collectQuestions(section.items));
  }
  return result;
}

export function QuizPlayer({ quizId }: Props) {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    fetch(`/play/${quizId}.json`)
      .then((r) => r.json())
      .then(setQuiz);
  }, [quizId]);

  const questions = useMemo(
    () => (quiz ? collectQuestions(quiz.items) : []),
    [quiz],
  );

  if (!quiz) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-8 text-text-muted">
        Loading...
      </div>
    );
  }

  const name = (quiz.frontmatter as any)?.name ?? quizId;
  const total = questions.length;

  if (finished) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="bg-bg-1 border border-border rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-text-primary mb-2">
            {name}
          </h2>
          <p className="text-4xl font-bold text-accent mb-2">
            {score} / {total}
          </p>
          <p className="text-text-secondary mb-6">
            {Math.round((score / total) * 100)}% correct
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => {
                setCurrent(0);
                setScore(0);
                setAnswered(false);
                setFinished(false);
              }}
              className="px-6 py-2 bg-accent text-bg-0 font-semibold rounded-lg hover:bg-accent-hover transition-colors"
            >
              Try again
            </button>
            <a
              href="/"
              className="px-6 py-2 bg-bg-2 text-text-primary font-semibold rounded-lg border border-border hover:border-accent transition-colors"
            >
              All quizzes
            </a>
          </div>
        </div>
      </div>
    );
  }

  const question = questions[current];

  const handleAnswer = (correct: boolean) => {
    if (correct) setScore((s) => s + 1);
    setAnswered(true);
  };

  const handleNext = () => {
    if (current + 1 >= total) {
      setFinished(true);
    } else {
      setCurrent((c) => c + 1);
      setAnswered(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-lg font-semibold text-text-secondary">{name}</h1>
        <span className="text-sm text-text-muted">
          {current + 1} / {total}
        </span>
      </div>
      <div className="w-full h-1 bg-bg-2 rounded-full mb-6">
        <div
          className="h-1 bg-accent rounded-full transition-all"
          style={{ width: `${((current + 1) / total) * 100}%` }}
        />
      </div>
      <div className="bg-bg-1 border border-border rounded-lg p-6">
        <QuestionView
          key={current}
          section={question}
          onAnswer={handleAnswer}
        />
        {answered && (
          <button
            onClick={handleNext}
            className="mt-6 px-6 py-2 bg-accent text-bg-0 font-semibold rounded-lg hover:bg-accent-hover transition-colors"
          >
            {current + 1 >= total ? "See results" : "Next"}
          </button>
        )}
      </div>
    </div>
  );
}
