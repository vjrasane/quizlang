import type { Extension } from "mdast-util-from-markdown";

export function quizFromMarkdown(): Extension {
  return {
    enter: {
      quizAnswer(token) {
        this.enter(
          { type: "quizAnswer", marker: "", children: [] } as any,
          token
        );
      },
      quizCategory(token) {
        this.enter(
          { type: "quizCategory", children: [] } as any,
          token
        );
      },
      quizMatchPair(token) {
        this.enter(
          { type: "quizMatchPair", value: "" } as any,
          token
        );
      },
      quizSortItem(token) {
        this.enter(
          { type: "quizSortItem", index: 0, children: [] } as any,
          token
        );
      },
      quizMetadata(token) {
        this.enter(
          { type: "quizMetadata", value: "" } as any,
          token
        );
      },
    },
    exit: {
      quizAnswerMarker(token) {
        const node = this.stack[this.stack.length - 1] as any;
        node.marker = this.sliceSerialize(token);
      },
      quizAnswer(token) {
        this.exit(token);
      },
      quizCategory(token) {
        this.exit(token);
      },
      quizMatchPairValue(token) {
        const node = this.stack[this.stack.length - 1] as any;
        node.value = this.sliceSerialize(token);
      },
      quizMatchPair(token) {
        this.exit(token);
      },
      quizSortItemIndex(token) {
        const node = this.stack[this.stack.length - 1] as any;
        node.index = parseInt(this.sliceSerialize(token), 10);
      },
      quizSortItem(token) {
        this.exit(token);
      },
      quizMetadataValue(token) {
        const node = this.stack[this.stack.length - 1] as any;
        node.value = this.sliceSerialize(token);
      },
      quizMetadata(token) {
        this.exit(token);
      },
    },
  };
}
