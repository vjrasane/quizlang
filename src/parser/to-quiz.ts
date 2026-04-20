import type { Root, RootContent, PhrasingContent } from "mdast";
import { unified } from "unified";
import remarkStringify from "remark-stringify";
import { parse as parseYaml } from "yaml";
import type {
  Quiz,
  QuizItem,
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

function toMatchPair(
  node: QuizMatchPair & { notes?: string | null }
): MatchPair {
  const sep = node.value.indexOf("==");
  if (sep === -1)
    return { left: node.value.trim(), right: "", notes: node.notes ?? null };
  return {
    left: node.value.slice(0, sep).trim(),
    right: node.value.slice(sep + 2).trim(),
    notes: node.notes ?? null,
  };
}

function parseMetadata(
  nodes: QuizMetadata[]
): Record<string, unknown> | undefined {
  if (nodes.length === 0) return undefined;
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
const isParagraph = is("paragraph");
const isThematicBreak = is("thematicBreak");

function isQuestionNode(node: AnyNode): boolean {
  return (
    isAnswer(node) || isCategory(node) || isSortItem(node) || isMatchPair(node)
  );
}

const stringifier = unified().use(remarkStringify);

function serializeBody(nodes: AnyNode[]): string {
  if (nodes.length === 0) return "";
  const tree: Root = { type: "root", children: nodes as RootContent[] };
  return stringifier.stringify(tree).trim();
}

// ── Question builders ───────────────────────────────────────────────

function buildQuestion(answers: WithNotes<QuizAnswer>[]): Question {
  const hasMultiCorrect = answers.some((a) => a.marker === "+");
  const mapped = answers.map(toAnswer);

  if (hasMultiCorrect) return { type: "MultiChoice", answers: mapped };
  if (mapped.length === 1 && mapped[0].correct)
    return { type: "FreeInput", answer: mapped[0] };
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

// ── Note collection ─────────────────────────────────────────────────

type WithNotes<T> = T & { notes?: string | null };

type CollectedQuestion = { question: Question; endIdx: number };

/**
 * Collect answer nodes with inter-answer paragraph notes.
 * Stops at trailing paragraphs after the last answer (caller handles --- rule).
 */
function collectAnswerQuestion(
  nodes: AnyNode[],
  startIdx: number
): CollectedQuestion {
  const answers: WithNotes<QuizAnswer>[] = [];
  let i = startIdx;

  while (i < nodes.length) {
    if (isAnswer(nodes[i])) {
      answers.push({ ...(nodes[i] as QuizAnswer), notes: null });
      i++;
    } else if (isParagraph(nodes[i]) && answers.length > 0) {
      // Look ahead: if more answers follow these paragraphs, they're notes
      let k = i;
      while (k < nodes.length && isParagraph(nodes[k])) k++;
      if (k < nodes.length && isAnswer(nodes[k])) {
        while (i < k) {
          const last = answers[answers.length - 1];
          const noteText = phrasingToText(nodes[i].children);
          last.notes = last.notes ? last.notes + "\n" + noteText : noteText;
          i++;
        }
      } else {
        break; // trailing — let caller decide
      }
    } else {
      break;
    }
  }

  return { question: buildQuestion(answers), endIdx: i };
}

function collectSortItemQuestion(
  nodes: AnyNode[],
  startIdx: number
): CollectedQuestion {
  const items: WithNotes<QuizSortItem>[] = [];
  let i = startIdx;

  while (i < nodes.length) {
    if (isSortItem(nodes[i])) {
      items.push({ ...(nodes[i] as QuizSortItem), notes: null });
      i++;
    } else if (isParagraph(nodes[i]) && items.length > 0) {
      let k = i;
      while (k < nodes.length && isParagraph(nodes[k])) k++;
      if (k < nodes.length && isSortItem(nodes[k])) {
        while (i < k) {
          const last = items[items.length - 1];
          const noteText = phrasingToText(nodes[i].children);
          last.notes = last.notes ? last.notes + "\n" + noteText : noteText;
          i++;
        }
      } else {
        break;
      }
    } else {
      break;
    }
  }

  return { question: buildSortingQuestion(items), endIdx: i };
}

function collectMatchPairQuestion(
  nodes: AnyNode[],
  startIdx: number
): CollectedQuestion {
  const pairs: WithNotes<QuizMatchPair>[] = [];
  let i = startIdx;

  while (i < nodes.length) {
    if (isMatchPair(nodes[i])) {
      pairs.push({ ...(nodes[i] as QuizMatchPair), notes: null });
      i++;
    } else if (isParagraph(nodes[i]) && pairs.length > 0) {
      let k = i;
      while (k < nodes.length && isParagraph(nodes[k])) k++;
      if (k < nodes.length && isMatchPair(nodes[k])) {
        while (i < k) {
          const last = pairs[pairs.length - 1];
          const noteText = phrasingToText(nodes[i].children);
          last.notes = last.notes ? last.notes + "\n" + noteText : noteText;
          i++;
        }
      } else {
        break;
      }
    } else {
      break;
    }
  }

  return { question: buildMatchingQuestion(pairs), endIdx: i };
}

function collectCategorizeQuestion(
  nodes: AnyNode[],
  startIdx: number
): CollectedQuestion {
  const categories: {
    header: QuizCategory;
    answers: WithNotes<QuizAnswer>[];
  }[] = [];
  let current: {
    header: QuizCategory;
    answers: WithNotes<QuizAnswer>[];
  } | null = null;
  let i = startIdx;

  while (i < nodes.length) {
    if (isCategory(nodes[i])) {
      if (current) categories.push(current);
      current = { header: nodes[i] as QuizCategory, answers: [] };
      i++;
    } else if (isAnswer(nodes[i]) && current) {
      current.answers.push({ ...(nodes[i] as QuizAnswer), notes: null });
      i++;
    } else if (isParagraph(nodes[i]) && current && current.answers.length > 0) {
      let k = i;
      while (k < nodes.length && isParagraph(nodes[k])) k++;
      if (
        k < nodes.length &&
        (isAnswer(nodes[k]) || isCategory(nodes[k]))
      ) {
        while (i < k) {
          const last = current.answers[current.answers.length - 1];
          const noteText = phrasingToText(nodes[i].children);
          last.notes = last.notes ? last.notes + "\n" + noteText : noteText;
          i++;
        }
      } else {
        break;
      }
    } else {
      break;
    }
  }
  if (current) categories.push(current);

  return { question: buildCategorizeQuestion(categories), endIdx: i };
}

function collectQuestion(
  nodes: AnyNode[],
  startIdx: number
): CollectedQuestion {
  const first = nodes[startIdx];
  if (isCategory(first)) return collectCategorizeQuestion(nodes, startIdx);
  if (isSortItem(first)) return collectSortItemQuestion(nodes, startIdx);
  if (isMatchPair(first)) return collectMatchPairQuestion(nodes, startIdx);
  return collectAnswerQuestion(nodes, startIdx);
}

// ── Trailing note attachment via --- rule ────────────────────────────

function attachTrailingNotes(
  question: Question,
  paragraphs: AnyNode[]
): void {
  if (paragraphs.length === 0) return;
  const noteText = paragraphs
    .map((n) => phrasingToText(n.children))
    .join("\n");

  switch (question.type) {
    case "SingleChoice":
    case "MultiChoice": {
      const last = question.answers[question.answers.length - 1];
      last.notes = last.notes ? last.notes + "\n" + noteText : noteText;
      break;
    }
    case "FreeInput": {
      const a = question.answer;
      a.notes = a.notes ? a.notes + "\n" + noteText : noteText;
      break;
    }
    case "Sorting": {
      const last = question.items[question.items.length - 1];
      last.notes = last.notes ? last.notes + "\n" + noteText : noteText;
      break;
    }
    case "Matching": {
      const last = question.pairs[question.pairs.length - 1];
      last.notes = last.notes ? last.notes + "\n" + noteText : noteText;
      break;
    }
    case "Categorize": {
      const lastCat = question.categories[question.categories.length - 1];
      const lastAnswer = lastCat.answers[lastCat.answers.length - 1];
      lastAnswer.notes = lastAnswer.notes
        ? lastAnswer.notes + "\n" + noteText
        : noteText;
      break;
    }
  }
}

// ── Main entry ──────────────────────────────────────────────────────

/**
 * Convert the augmented mdast tree to the Quiz JSON structure.
 *
 * Questions are separated by quiz-specific nodes (answers, categories, etc.).
 * The body of each question is the markdown content before those nodes.
 *
 * Note disambiguation: text after the last answer in a question is a note
 * for that answer only if followed by a thematic break (---). Otherwise
 * it belongs to the next question's body.
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
    items: buildItems(children, startIdx),
  };
}

function buildItems(nodes: AnyNode[], startIdx: number): QuizItem[] {
  const items: QuizItem[] = [];
  let i = startIdx;

  while (i < nodes.length) {
    // Phase 1: Collect body nodes and metadata until a quiz node
    const bodyNodes: AnyNode[] = [];
    const metadataNodes: QuizMetadata[] = [];

    while (i < nodes.length && !isQuestionNode(nodes[i])) {
      if (isMetadata(nodes[i])) {
        metadataNodes.push(nodes[i] as QuizMetadata);
      } else {
        bodyNodes.push(nodes[i]);
      }
      i++;
    }

    // No quiz node found — orphan body content, skip
    if (i >= nodes.length) break;

    // Phase 2: Collect question nodes (with inter-node notes)
    const { question, endIdx } = collectQuestion(nodes, i);
    i = endIdx;

    // Phase 3: Trailing paragraphs — apply --- rule
    const trailingStart = i;
    while (i < nodes.length && isParagraph(nodes[i])) i++;

    if (trailingStart < i && i < nodes.length && isThematicBreak(nodes[i])) {
      // paragraphs + --- → notes for last item, consume the break
      attachTrailingNotes(question, nodes.slice(trailingStart, i));
      i++; // skip thematicBreak
    } else {
      // paragraphs belong to next question's body
      i = trailingStart;
    }

    const metadata = parseMetadata(metadataNodes);
    items.push({
      body: serializeBody(bodyNodes),
      question,
      ...(metadata !== undefined && { metadata }),
    });
  }

  return items;
}
