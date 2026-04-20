import type { Root, PhrasingContent } from "mdast";
import { parse as parseYaml } from "yaml";
import type {
  Quiz,
  Section,
  Question,
  Answer,
  Category,
  SortItem,
  MatchPair,
} from "../types/quiz.js";
import type {
  QuizAnswer,
  QuizCategory,
  QuizSortItem,
  QuizMatchPair,
  QuizMetadata,
} from "./types.js";

// mdast doesn't know about our custom node types at the union level,
// so we use a loose interface for tree traversal.
interface AnyNode {
  type: string;
  [key: string]: any;
}

/** Serialize phrasing content back to plain text */
function phrasingToText(children: PhrasingContent[]): string {
  return children
    .map((child) => {
      if (child.type === "text") return child.value;
      if ("children" in child)
        return phrasingToText(child.children as PhrasingContent[]);
      if ("value" in child) return (child as any).value;
      return "";
    })
    .join("");
}

/** Extract label like `(a)` from the start of answer text */
function extractLabel(text: string): { label: string | null; rest: string } {
  const match = text.match(/^\(([^)]+)\)\s*(.*)/);
  if (match) return { label: match[1], rest: match[2] };
  return { label: null, rest: text };
}

function toAnswer(node: QuizAnswer & { notes?: string | null }): Answer {
  const text = phrasingToText(node.children);
  const { label, rest } = extractLabel(text);
  return {
    text: rest,
    correct: node.marker === "=" || node.marker === "+",
    label,
    notes: node.notes ?? null,
  };
}

function toSortItem(node: QuizSortItem & { notes?: string | null }): SortItem {
  return {
    text: phrasingToText(node.children),
    key: node.index,
    notes: node.notes ?? null,
  };
}

function toMatchPair(node: QuizMatchPair & { notes?: string | null }): MatchPair {
  const sep = node.value.indexOf("==");
  if (sep === -1) return { left: node.value.trim(), right: "", notes: node.notes ?? null };
  return {
    left: node.value.slice(0, sep).trim(),
    right: node.value.slice(sep + 2).trim(),
    notes: node.notes ?? null,
  };
}

function parseMetadata(
  nodes: QuizMetadata[]
): Record<string, unknown> | null {
  if (nodes.length === 0) return null;
  const yamlStr = nodes.map((n) => n.value).join("\n");
  return parseYaml(yamlStr);
}

function is(type: string) {
  return (node: AnyNode) => node.type === type;
}

const isAnswer = is("quizAnswer");
const isCategory = is("quizCategory");
const isSortItem = is("quizSortItem");
const isMatchPair = is("quizMatchPair");
const isMetadata = is("quizMetadata");
const isHeading = is("heading");
const isParagraph = is("paragraph");

function isQuestionNode(node: AnyNode): boolean {
  return isAnswer(node) || isCategory(node) || isSortItem(node) || isMatchPair(node);
}

/** Determine question type from answer nodes */
function buildQuestion(answers: WithNotes<QuizAnswer>[]): Question {
  const hasMultiCorrect = answers.some((a) => a.marker === "+");
  const mapped = answers.map(toAnswer);

  if (hasMultiCorrect) return { type: "MultiChoice", answers: mapped };

  if (mapped.length === 1 && mapped[0].correct) {
    return { type: "FreeInput", answer: mapped[0] };
  }

  return { type: "SingleChoice", answers: mapped };
}

function buildCategorizeQuestion(
  categories: { header: QuizCategory; answers: WithNotes<QuizAnswer>[] }[]
): Question {
  return {
    type: "Categorize",
    categories: categories.map(
      (c): Category => ({
        text: phrasingToText(c.header.children),
        answers: c.answers.map(toAnswer),
      })
    ),
  };
}

function buildSortingQuestion(items: WithNotes<QuizSortItem>[]): Question {
  return { type: "Sorting", items: items.map(toSortItem) };
}

function buildMatchingQuestion(pairs: WithNotes<QuizMatchPair>[]): Question {
  return { type: "Matching", pairs: pairs.map(toMatchPair) };
}

/**
 * Convert the augmented mdast tree to the Quiz JSON structure.
 */
export function toQuiz(tree: Root): Quiz {
  const children = tree.children as AnyNode[];
  let frontmatter: unknown = undefined;
  let startIdx = 0;

  if (children[0]?.type === "yaml") {
    frontmatter = parseYaml(children[0].value);
    startIdx = 1;
  }

  return {
    frontmatter,
    items: buildSections(children.slice(startIdx), 1),
  };
}

/** Group flat node list into hierarchical sections by heading depth */
function buildSections(nodes: AnyNode[], minLevel: number): Section[] {
  const sections: Section[] = [];
  let i = 0;

  while (i < nodes.length) {
    const node = nodes[i];

    if (isHeading(node) && node.depth >= minLevel) {
      const depth = node.depth as number;
      const header = phrasingToText(node.children);
      i++;

      const body: AnyNode[] = [];
      while (i < nodes.length) {
        if (isHeading(nodes[i]) && nodes[i].depth <= depth) break;
        body.push(nodes[i]);
        i++;
      }

      sections.push(buildSection(header, body, depth));
    } else {
      // Headerless question block (new format)
      const body: AnyNode[] = [];
      while (i < nodes.length) {
        if (isHeading(nodes[i])) break;
        body.push(nodes[i]);
        i++;
      }

      if (body.some(isQuestionNode)) {
        sections.push(buildSection("", body, minLevel));
      }
    }
  }

  return sections;
}

function buildSection(
  header: string,
  nodes: AnyNode[],
  depth: number
): Section {
  const textParts: string[] = [];
  const metadataNodes: QuizMetadata[] = [];
  let question: Question | null = null;
  const childSectionNodes: AnyNode[] = [];

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];

    if (isHeading(node)) {
      childSectionNodes.push(...nodes.slice(i));
      break;
    }

    if (isMetadata(node)) {
      metadataNodes.push(node as QuizMetadata);
      continue;
    }

    if (isQuestionNode(node)) {
      question = buildQuestionFromNodes(nodes.slice(i));
      break;
    }

    if (isParagraph(node)) {
      textParts.push(phrasingToText(node.children));
    }
  }

  return {
    header,
    text: textParts.length > 0 ? textParts.join("\n\n") : null,
    metadata: parseMetadata(metadataNodes),
    question,
    items:
      childSectionNodes.length > 0
        ? buildSections(childSectionNodes, depth + 1)
        : [],
  };
}

/**
 * Collect answer nodes with their trailing paragraph notes.
 * A paragraph immediately after an answer (before the next answer/heading)
 * is treated as that answer's notes.
 */
type WithNotes<T> = T & { notes?: string | null };

function collectAnswersWithNotes(nodes: AnyNode[]): WithNotes<QuizAnswer>[] {
  const answers: WithNotes<QuizAnswer>[] = [];
  for (const node of nodes) {
    if (isAnswer(node)) {
      answers.push({ ...(node as QuizAnswer), notes: null });
    } else if (isParagraph(node) && answers.length > 0) {
      const last = answers[answers.length - 1];
      const noteText = phrasingToText(node.children);
      last.notes = last.notes ? last.notes + "\n" + noteText : noteText;
    }
  }
  return answers;
}

function collectSortItemsWithNotes(nodes: AnyNode[]): WithNotes<QuizSortItem>[] {
  const items: WithNotes<QuizSortItem>[] = [];
  for (const node of nodes) {
    if (isSortItem(node)) {
      items.push({ ...(node as QuizSortItem), notes: null });
    } else if (isParagraph(node) && items.length > 0) {
      const last = items[items.length - 1];
      const noteText = phrasingToText(node.children);
      last.notes = last.notes ? last.notes + "\n" + noteText : noteText;
    }
  }
  return items;
}

function collectMatchPairsWithNotes(nodes: AnyNode[]): WithNotes<QuizMatchPair>[] {
  const pairs: WithNotes<QuizMatchPair>[] = [];
  for (const node of nodes) {
    if (isMatchPair(node)) {
      pairs.push({ ...(node as QuizMatchPair), notes: null });
    } else if (isParagraph(node) && pairs.length > 0) {
      const last = pairs[pairs.length - 1];
      const noteText = phrasingToText(node.children);
      last.notes = last.notes ? last.notes + "\n" + noteText : noteText;
    }
  }
  return pairs;
}

function buildQuestionFromNodes(nodes: AnyNode[]): Question | null {
  const first = nodes.find(isQuestionNode);
  if (!first) return null;

  if (isCategory(first)) return buildCategorizeFromNodes(nodes);
  if (isSortItem(first)) {
    const items = collectSortItemsWithNotes(nodes);
    return buildSortingQuestion(items);
  }
  if (isMatchPair(first)) {
    const pairs = collectMatchPairsWithNotes(nodes);
    return buildMatchingQuestion(pairs);
  }
  if (isAnswer(first)) {
    const answers = collectAnswersWithNotes(nodes);
    return buildQuestion(answers);
  }

  return null;
}

function buildCategorizeFromNodes(nodes: AnyNode[]): Question {
  const categories: { header: QuizCategory; answers: WithNotes<QuizAnswer>[] }[] = [];
  let current: { header: QuizCategory; answers: WithNotes<QuizAnswer>[] } | null = null;

  for (const node of nodes) {
    if (isCategory(node)) {
      if (current) categories.push(current);
      current = { header: node as QuizCategory, answers: [] };
    } else if (isAnswer(node) && current) {
      current.answers.push({ ...(node as QuizAnswer), notes: null });
    } else if (isParagraph(node) && current && current.answers.length > 0) {
      const last = current.answers[current.answers.length - 1];
      const noteText = phrasingToText(node.children);
      last.notes = last.notes ? last.notes + "\n" + noteText : noteText;
    }
  }
  if (current) categories.push(current);

  return buildCategorizeQuestion(categories);
}
