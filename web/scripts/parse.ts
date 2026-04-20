import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { parseQuiz } from "../src/parser/index.js";

const quizDir = resolve("quizzes");
const dataDir = resolve("data");

mkdirSync(dataDir, { recursive: true });

const files = readdirSync(quizDir).filter((f) => f.endsWith(".quiz"));

for (const file of files) {
  const content = readFileSync(join(quizDir, file), "utf-8");
  const quiz = parseQuiz(content);
  const outName = basename(file, ".quiz") + ".json";
  writeFileSync(join(dataDir, outName), JSON.stringify(quiz, null, 2) + "\n");
  console.log(`Parsed ${file} → ${outName}`);
}
