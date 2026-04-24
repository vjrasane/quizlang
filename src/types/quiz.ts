import { z } from "zod";

const AnswerSchema = z
  .object({
    correct: z.boolean(),
    label: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
    text: z.string(),
  })
  .passthrough();

const CategorySchema = z
  .object({
    answers: z.array(AnswerSchema),
    text: z.string(),
  })
  .passthrough();

const SortItemSchema = z
  .object({
    key: z.number(),
    notes: z.string().nullable().optional(),
    text: z.string(),
  })
  .passthrough();

const MatchPairSchema = z
  .object({
    left: z.string(),
    notes: z.string().nullable().optional(),
    right: z.string(),
  })
  .passthrough();

const QuestionSchema = z.discriminatedUnion("type", [
  z
    .object({ type: z.literal("FreeInput"), answer: AnswerSchema })
    .passthrough(),
  z
    .object({
      type: z.literal("SingleChoice"),
      answers: z.array(AnswerSchema),
    })
    .passthrough(),
  z
    .object({ type: z.literal("MultiChoice"), answers: z.array(AnswerSchema) })
    .passthrough(),
  z
    .object({
      type: z.literal("Categorize"),
      categories: z.array(CategorySchema),
    })
    .passthrough(),
  z
    .object({ type: z.literal("Sorting"), items: z.array(SortItemSchema) })
    .passthrough(),
  z
    .object({ type: z.literal("Matching"), pairs: z.array(MatchPairSchema) })
    .passthrough(),
]);

const QuizItemSchema = z.object({
  body: z.string(),
  question: QuestionSchema,
  metadata: z.unknown().optional(),
});

export const Locale = z.enum(["en", "fi"]);

export type Locale = z.infer<typeof Locale>;

const Frontmatter = z.object({
  name: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  language: Locale.optional(),
});

export const QuizSchema = z.object({
  frontmatter: Frontmatter.optional(),
  items: z.array(QuizItemSchema),
});

export const AnswerStateSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("SingleChoice"),
    value: z.number(),
    correct: z.boolean(),
  }),
  z.object({
    type: z.literal("MultiChoice"),
    value: z.array(z.number()),
    correct: z.boolean(),
  }),
  z.object({
    type: z.literal("FreeInput"),
    value: z.string(),
    correct: z.boolean(),
  }),
  z.object({
    type: z.literal("Categorize"),
    value: z.record(z.string(), z.number().nullable()),
    correct: z.boolean(),
  }),
  z.object({
    type: z.literal("Sorting"),
    value: z.array(z.number()),
    correct: z.boolean(),
  }),
  z.object({
    type: z.literal("Matching"),
    value: z.record(z.string(), z.number()),
    correct: z.boolean(),
  }),
]);

export type AnswerState = z.infer<typeof AnswerStateSchema>;

export type Question = z.infer<typeof QuestionSchema>;
export type Quiz = z.infer<typeof QuizSchema>;
export type QuizItem = z.infer<typeof QuizItemSchema>;
export type Answer = z.infer<typeof AnswerSchema>;
export type Category = z.infer<typeof CategorySchema>;
export type SortItem = z.infer<typeof SortItemSchema>;
export type MatchPair = z.infer<typeof MatchPairSchema>;

const StepStateSchema = z.object({
  type: z.literal("question"),
  answers: z.array(AnswerStateSchema),
});

export type StepState = z.infer<typeof StepStateSchema>;

export const QuizStateSchema = z.object({
  seed: z.number(),
  steps: z.array(StepStateSchema),
});

export type QuizState = z.infer<typeof QuizStateSchema>;
