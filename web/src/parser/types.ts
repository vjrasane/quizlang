import type { Parent, Literal, PhrasingContent } from "mdast";

/** Answer line: `= text`, `- text`, `+ text` */
export interface QuizAnswer extends Parent {
  type: "quizAnswer";
  marker: "=" | "-" | "+";
  children: PhrasingContent[];
}

/** Category header: `> text` */
export interface QuizCategory extends Parent {
  type: "quizCategory";
  children: PhrasingContent[];
}

/** Sort item: `1. text` */
export interface QuizSortItem extends Parent {
  type: "quizSortItem";
  index: number;
  children: PhrasingContent[];
}

/** Match pair: `~ left == right` */
export interface QuizMatchPair extends Literal {
  type: "quizMatchPair";
  value: string;
}

/** Metadata: `@key: value` */
export interface QuizMetadata extends Literal {
  type: "quizMetadata";
  value: string;
}

export type QuizNode =
  | QuizAnswer
  | QuizCategory
  | QuizSortItem
  | QuizMatchPair
  | QuizMetadata;

// Augment mdast types to include quiz nodes in the tree
declare module "mdast" {
  interface BlockContentMap {
    quizAnswer: QuizAnswer;
    quizCategory: QuizCategory;
    quizSortItem: QuizSortItem;
    quizMatchPair: QuizMatchPair;
    quizMetadata: QuizMetadata;
  }
}

// Augment micromark token types
declare module "micromark-util-types" {
  interface TokenTypeMap {
    quizAnswer: "quizAnswer";
    quizAnswerMarker: "quizAnswerMarker";
    quizAnswerValue: "quizAnswerValue";
    quizCategory: "quizCategory";
    quizCategoryMarker: "quizCategoryMarker";
    quizCategoryValue: "quizCategoryValue";
    quizMatchPair: "quizMatchPair";
    quizMatchPairMarker: "quizMatchPairMarker";
    quizMatchPairValue: "quizMatchPairValue";
    quizSortItem: "quizSortItem";
    quizSortItemIndex: "quizSortItemIndex";
    quizSortItemValue: "quizSortItemValue";
    quizMetadata: "quizMetadata";
    quizMetadataMarker: "quizMetadataMarker";
    quizMetadataValue: "quizMetadataValue";
  }
}
