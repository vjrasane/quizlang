import type {
  Code,
  Construct,
  Extension,
  State,
  TokenizeContext,
  Effects,
} from "micromark-util-types";
import { codes } from "micromark-util-symbol";
import "./types.js";

function isLineEnding(code: Code): boolean {
  return (
    code === codes.lineFeed ||
    code === codes.carriageReturn ||
    code === codes.carriageReturnLineFeed
  );
}

function isEof(code: Code): code is null {
  return code === codes.eof;
}

function isLineEnd(code: Code): boolean {
  return isEof(code) || isLineEnding(code);
}

function isDigit(code: Code): boolean {
  return (
    code !== null &&
    code >= codes.digit0 &&
    code <= codes.digit9
  );
}

/** Tokenizer for answer lines: `= text`, `- text`, `+ text` */
function tokenizeAnswer(
  this: TokenizeContext,
  effects: Effects,
  ok: State,
  nok: State
): State {
  return start;

  function start(code: Code): State | undefined {
    if (
      code !== codes.equalsTo &&
      code !== codes.dash &&
      code !== codes.plusSign
    ) {
      return nok(code);
    }
    effects.enter("quizAnswer");
    effects.enter("quizAnswerMarker");
    effects.consume(code);
    return afterMarker;
  }

  function afterMarker(code: Code): State | undefined {
    if (code !== codes.space) return nok(code);
    effects.exit("quizAnswerMarker");
    effects.consume(code);
    effects.enter("quizAnswerValue", { contentType: "text" });
    return value;
  }

  function value(code: Code): State | undefined {
    if (isLineEnd(code)) {
      effects.exit("quizAnswerValue");
      effects.exit("quizAnswer");
      return ok(code);
    }
    effects.consume(code);
    return value;
  }
}

/** Tokenizer for category headers: `> text` */
function tokenizeCategory(
  this: TokenizeContext,
  effects: Effects,
  ok: State,
  nok: State
): State {
  return start;

  function start(code: Code): State | undefined {
    if (code !== codes.greaterThan) return nok(code);
    effects.enter("quizCategory");
    effects.enter("quizCategoryMarker");
    effects.consume(code);
    return afterMarker;
  }

  function afterMarker(code: Code): State | undefined {
    if (code !== codes.space) return nok(code);
    effects.exit("quizCategoryMarker");
    effects.consume(code);
    effects.enter("quizCategoryValue", { contentType: "text" });
    return value;
  }

  function value(code: Code): State | undefined {
    if (isLineEnd(code)) {
      effects.exit("quizCategoryValue");
      effects.exit("quizCategory");
      return ok(code);
    }
    effects.consume(code);
    return value;
  }
}

/** Tokenizer for match pairs: `~ left == right` */
function tokenizeMatchPair(
  this: TokenizeContext,
  effects: Effects,
  ok: State,
  nok: State
): State {
  return start;

  function start(code: Code): State | undefined {
    if (code !== codes.tilde) return nok(code);
    effects.enter("quizMatchPair");
    effects.enter("quizMatchPairMarker");
    effects.consume(code);
    return afterMarker;
  }

  function afterMarker(code: Code): State | undefined {
    if (code !== codes.space) return nok(code);
    effects.exit("quizMatchPairMarker");
    effects.consume(code);
    effects.enter("quizMatchPairValue");
    return value;
  }

  function value(code: Code): State | undefined {
    if (isLineEnd(code)) {
      effects.exit("quizMatchPairValue");
      effects.exit("quizMatchPair");
      return ok(code);
    }
    effects.consume(code);
    return value;
  }
}

/** Tokenizer for sort items: `1. text` */
function tokenizeSortItem(
  this: TokenizeContext,
  effects: Effects,
  ok: State,
  nok: State
): State {
  return start;

  function start(code: Code): State | undefined {
    if (!isDigit(code)) return nok(code);
    effects.enter("quizSortItem");
    effects.enter("quizSortItemIndex");
    effects.consume(code);
    return digits;
  }

  function digits(code: Code): State | undefined {
    if (isDigit(code)) {
      effects.consume(code);
      return digits;
    }
    if (code !== codes.dot) return nok(code);
    effects.exit("quizSortItemIndex");
    effects.consume(code);
    return afterDot;
  }

  function afterDot(code: Code): State | undefined {
    if (code !== codes.space) return nok(code);
    effects.consume(code);
    effects.enter("quizSortItemValue", { contentType: "text" });
    return value;
  }

  function value(code: Code): State | undefined {
    if (isLineEnd(code)) {
      effects.exit("quizSortItemValue");
      effects.exit("quizSortItem");
      return ok(code);
    }
    effects.consume(code);
    return value;
  }
}

/** Tokenizer for metadata: `@key: value` */
function tokenizeMetadata(
  this: TokenizeContext,
  effects: Effects,
  ok: State,
  nok: State
): State {
  return start;

  function start(code: Code): State | undefined {
    if (code !== codes.atSign) return nok(code);
    effects.enter("quizMetadata");
    effects.enter("quizMetadataMarker");
    effects.consume(code);
    effects.exit("quizMetadataMarker");
    effects.enter("quizMetadataValue");
    return value;
  }

  function value(code: Code): State | undefined {
    if (isLineEnd(code)) {
      effects.exit("quizMetadataValue");
      effects.exit("quizMetadata");
      return ok(code);
    }
    effects.consume(code);
    return value;
  }
}

const answerConstruct: Construct = {
  tokenize: tokenizeAnswer,
  concrete: true,
};

const categoryConstruct: Construct = {
  tokenize: tokenizeCategory,
  concrete: true,
};

const matchPairConstruct: Construct = {
  tokenize: tokenizeMatchPair,
  concrete: true,
};

const sortItemConstruct: Construct = {
  tokenize: tokenizeSortItem,
  concrete: true,
};

const metadataConstruct: Construct = {
  tokenize: tokenizeMetadata,
  concrete: true,
};

export function quizSyntax(): Extension {
  return {
    disable: { null: ["list", "blockQuote"] },
    flow: {
      [codes.equalsTo]: answerConstruct,
      [codes.dash]: answerConstruct,
      [codes.plusSign]: answerConstruct,
      [codes.greaterThan]: categoryConstruct,
      [codes.tilde]: matchPairConstruct,
      [codes.atSign]: metadataConstruct,
      [codes.digit0]: sortItemConstruct,
      [codes.digit1]: sortItemConstruct,
      [codes.digit2]: sortItemConstruct,
      [codes.digit3]: sortItemConstruct,
      [codes.digit4]: sortItemConstruct,
      [codes.digit5]: sortItemConstruct,
      [codes.digit6]: sortItemConstruct,
      [codes.digit7]: sortItemConstruct,
      [codes.digit8]: sortItemConstruct,
      [codes.digit9]: sortItemConstruct,
    },
  };
}
