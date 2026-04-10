import { createHash } from "crypto";
import { readFileSync, readdirSync } from "fs";
import { basename, join } from "path";

export function hashFile(filePath: string): string {
  const content = readFileSync(filePath);
  return createHash("sha256").update(content).digest("hex").slice(0, 8);
}

export function outputFileName(sourcePath: string, hash: string): string {
  const name = basename(sourcePath);
  return `${name}-${hash}.quiz`;
}

export function findStaleFiles(
  sourcesDir: string,
  outputDir: string,
): { sourcePath: string; outputName: string }[] {
  const sourceFiles = readdirSync(sourcesDir).map((f) => join(sourcesDir, f));
  const existingOutputs = new Set(readdirSync(outputDir));

  return sourceFiles
    .map((sourcePath) => {
      const hash = hashFile(sourcePath);
      const outputName = outputFileName(sourcePath, hash);
      return { sourcePath, outputName };
    })
    .filter(({ outputName }) => !existingOutputs.has(outputName));
}
