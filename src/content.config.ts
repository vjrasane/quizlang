import { defineCollection } from "astro:content";
import { quizLoader } from "./parser/loader.js";

const quizzes = defineCollection({
  loader: quizLoader("quizzes"),
});

export const collections = { quizzes };
