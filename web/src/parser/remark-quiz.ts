/// <reference types="remark-parse" />
import type { Root } from "mdast";
import type { Processor } from "unified";
import { quizSyntax } from "./micromark-quiz.js";
import { quizFromMarkdown } from "./mdast-util-quiz.js";
import "./types.js";

export default function remarkQuiz(this: Processor<Root>) {
  const data = this.data();

  const micromarkExtensions =
    data.micromarkExtensions || (data.micromarkExtensions = []);
  const fromMarkdownExtensions =
    data.fromMarkdownExtensions || (data.fromMarkdownExtensions = []);

  micromarkExtensions.push(quizSyntax());
  fromMarkdownExtensions.push(quizFromMarkdown());
}
