import {
  QuizStateSchema,
  type AnswerState,
  type Quiz,
  type QuizState,
  type StepState,
} from "./types/quiz";
import { djb2Hash, generateSeed } from "./utils";

const STORAGE_PREFIX = "quizlang-quiz-";

function storageKey(quizId: string, quizHash: string): string {
  return `${STORAGE_PREFIX}${quizId}-${quizHash}`;
}

export function isComplete(step: StepState): boolean {
  return step.answers.some((a) => a.correct);
}

export function isCorrect(step: StepState): boolean {
  return step.answers[0]?.correct;
}

export function getScore(state: QuizState): number {
  return state.steps.filter((s) => s.answers[0]?.correct).length;
}

export function getHash(quiz: Quiz): string {
  return djb2Hash(JSON.stringify(quiz));
}

export function initQuizState(): QuizState {
  return {
    seed: generateSeed(),
    steps: [],
  };
}

export function loadQuizState(
  quizId: string,
  quizHash: string,
): QuizState | null {
  try {
    const raw = localStorage.getItem(storageKey(quizId, quizHash));
    if (!raw) return null;
    const result = QuizStateSchema.safeParse(JSON.parse(raw));
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

export function saveQuizState(
  quizId: string,
  quizHash: string,
  state: QuizState,
): void {
  try {
    localStorage.setItem(storageKey(quizId, quizHash), JSON.stringify(state));
  } catch {}
}
