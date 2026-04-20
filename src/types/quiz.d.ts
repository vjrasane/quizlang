/* eslint-disable */

export type Question =
  | {
      answer: Answer;
      type: "FreeInput";
      [k: string]: unknown;
    }
  | {
      answers: Answer[];
      type: "SingleChoice";
      [k: string]: unknown;
    }
  | {
      answers: Answer[];
      type: "MultiChoice";
      [k: string]: unknown;
    }
  | {
      categories: Category[];
      type: "Categorize";
      [k: string]: unknown;
    }
  | {
      items: SortItem[];
      type: "Sorting";
      [k: string]: unknown;
    }
  | {
      pairs: MatchPair[];
      type: "Matching";
      [k: string]: unknown;
    };

export interface Quiz {
  frontmatter?: unknown;
  items: QuizItem[];
}
export interface QuizItem {
  body: string;
  question: Question;
  metadata?: unknown;
}
export interface Answer {
  correct: boolean;
  label?: string | null;
  notes?: string | null;
  text: string;
  [k: string]: unknown;
}
export interface Category {
  answers: Answer[];
  text: string;
  [k: string]: unknown;
}
export interface SortItem {
  key: number;
  notes?: string | null;
  text: string;
  [k: string]: unknown;
}
export interface MatchPair {
  left: string;
  notes?: string | null;
  right: string;
  [k: string]: unknown;
}
