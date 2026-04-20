import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkFrontmatter from "remark-frontmatter";
import type { Root } from "mdast";
import remarkQuiz from "./remark-quiz.js";
import { toQuiz } from "./to-quiz.js";
import type { Quiz } from "../types/quiz.js";

export function parseQuiz(content: string): Quiz {
  const processor = unified()
    .use(remarkParse)
    .use(remarkFrontmatter, "yaml");
  // @ts-expect-error -- quiz plugin augments the tree with custom nodes
  processor.use(remarkQuiz);
  const tree = processor.parse(content) as Root;
  const transformed = processor.runSync(tree) as Root;
  return toQuiz(transformed);
}
