import { defineCollection } from "astro:content";
import { quizLoader } from "./parser/loader.js";
import { QuizSchema } from "./types/quiz.js";

const quizzes = defineCollection({
  loader: quizLoader("quizzes"),
  schema: QuizSchema,
});

export const collections = { quizzes };
