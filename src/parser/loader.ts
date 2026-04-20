import type { Loader } from "astro/loaders";
import {
  readdirSync,
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
} from "node:fs";
import { basename, join, resolve } from "node:path";
import { createHash } from "node:crypto";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import type { Root as HastRoot } from "hast";
import { visit } from "unist-util-visit";
import { parseQuiz } from "./index.js";

function isRemoteUrl(src: string): boolean {
  return src.startsWith("http://") || src.startsWith("https://");
}

function localImagePath(url: string): string {
  const hash = createHash("sha256").update(url).digest("hex").slice(0, 12);
  const name = basename(new URL(url).pathname);
  return `${hash}-${name}`;
}

function rehypeLocalImages(this: unknown, outDir: string, basePath: string) {
  return async (tree: HastRoot) => {
    const downloads: Promise<void>[] = [];

    visit(tree, "element", (node) => {
      if (
        node.tagName !== "img" ||
        typeof node.properties.src !== "string" ||
        !isRemoteUrl(node.properties.src)
      )
        return;

      const src = node.properties.src;
      const filename = localImagePath(src);
      const dest = join(outDir, filename);
      node.properties.src = `${basePath}/images/${filename}`;

      if (!existsSync(dest)) {
        downloads.push(
          fetch(src)
            .then((r) => {
              if (!r.ok) throw new Error(`${r.status} fetching ${src}`);
              return r.arrayBuffer();
            })
            .then((buf) => writeFileSync(dest, Buffer.from(buf))),
        );
      }
    });

    await Promise.all(downloads);
  };
}

export function quizLoader(dir: string): Loader {
  return {
    name: "quiz-loader",
    load: async ({ store, logger, config }) => {
      const quizDir = resolve(dir);
      const imagesDir = resolve("public/images");
      mkdirSync(imagesDir, { recursive: true });

      const base = (config.base ?? "/").replace(/\/$/, "");

      const md = unified()
        .use(remarkParse)
        .use(remarkRehype)
        .use(rehypeLocalImages, imagesDir, base)
        .use(rehypeStringify);

      const files = readdirSync(quizDir).filter((f) => f.endsWith(".quiz"));
      store.clear();

      for (const file of files) {
        const id = basename(file, ".quiz");
        const content = readFileSync(join(quizDir, file), "utf-8");
        const quiz = parseQuiz(content);

        for (const item of quiz.items) {
          if (item.body) {
            item.body = String(await md.process(item.body));
          }
        }

        store.set({ id, data: { ...quiz } });
        logger.info(`Loaded ${file}`);
      }
    },
  };
}
