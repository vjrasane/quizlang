import { findStaleFiles } from "./hasher.js";
import { generateQuiz } from "./agent.js";
import { writeFileSync, mkdirSync, existsSync, unlinkSync } from "fs";
import { join, dirname } from "path";
import { execSync } from "child_process";
import { tmpdir } from "os";

const WEB_DIR = dirname(import.meta.dirname!);
const SOURCES_DIR = join(WEB_DIR, "sources");
const OUTPUT_DIR = join(WEB_DIR, "quizzes");

function ensureDirs() {
  if (!existsSync(SOURCES_DIR)) mkdirSync(SOURCES_DIR, { recursive: true });
  if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });
}

function validate(quizContent: string): boolean {
  const tmpFile = join(tmpdir(), `quiz-validate-${Date.now()}.quiz`);
  try {
    writeFileSync(tmpFile, quizContent);
    execSync(`quiz parse ${tmpFile}`, { encoding: "utf-8" });
    return true;
  } catch {
    return false;
  } finally {
    try { unlinkSync(tmpFile); } catch {}
  }
}

async function main() {
  ensureDirs();

  const stale = findStaleFiles(SOURCES_DIR, OUTPUT_DIR);

  if (stale.length === 0) {
    console.log("All quizzes are up to date.");
    return;
  }

  console.log(`Found ${stale.length} source(s) to process.`);

  for (const { sourcePath, outputName } of stale) {
    console.log(`Processing: ${sourcePath} → ${outputName}`);

    try {
      const quiz = await generateQuiz(sourcePath);

      console.log("--- Generated output ---");
      console.log(quiz);
      console.log("--- End output ---");
      if (validate(quiz)) {
        writeFileSync(join(OUTPUT_DIR, outputName), quiz);
        console.log(`  ✓ Generated ${outputName}`);
      } else {
        console.error(`  ✗ Generated quiz failed validation, skipping.`);
      }
    } catch (error) {
      console.error(`  ✗ Error processing ${sourcePath}:`, error);
    }
  }
}

main();
