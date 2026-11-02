/** What is wrong in a piece of JSON and where. `line` and `column` count from 1; `offset` is the position between characters, for putting the caret there. */
export interface CodeProblem {
  /** A sentence that ends with the place: "Unexpected token } at line 4, column 3". */
  message: string;
  line: number;
  column: number;
  offset: number;
}

/** The verdict on a text: fine (`empty` when there is nothing in it yet), or the first mistake in it. */
export type CodeValidation = { valid: true; empty: boolean } | ({ valid: false } & CodeProblem);

/** `word` is a run of letters that is not true, false or null: wrong as a value, and as a property name it is a key that lacks its quotes. */
type TokenKind = "punct" | "string" | "number" | "literal" | "word";

interface Token {
  kind: TokenKind;
  text: string;
  start: number;
  end: number;
}

/** A mistake found while reading: what it is, and where it is as a position between characters. */
class Mistake extends Error {
  offset: number;

  constructor(reason: string, offset: number) {
    super(reason);
    this.offset = offset;
  }
}

const fail = (reason: string, offset: number): never => {
  throw new Mistake(reason, offset);
};

const MAX_DEPTH = 200;
const isDigit = (char: string) => char >= "0" && char <= "9";
const isWord = (char: string) => /[A-Za-z_$]/.test(char);
const isPunct = (token: Token | null, text: string): boolean => token !== null && token.kind === "punct" && token.text === text;
const startsValue = (token: Token) => token.kind !== "punct" || token.text === "{" || token.text === "[";

/** Words people write by habit that JSON does not have, with what to write instead. */
const WORDS: Record<string, string> = {
  undefined: "undefined is not valid JSON, use null",
  NaN: "NaN is not valid JSON, use null",
  Infinity: "Infinity is not valid JSON, use null",
  True: "Write true in lower case",
  False: "Write false in lower case",
  Null: "Write null in lower case",
  None: "None is not valid JSON, use null",
};

/** A character nobody can see on a screen: any kind of space, a control character, a zero-width or direction mark, a byte order mark. */
const UNSEEN = /[\s\p{Cc}\p{Cf}]/u;

/** What the message calls the character it stopped at: the character itself when it can be seen, otherwise a name, or its code point, so a pasted non-breaking space or byte order mark does not read as "Unexpected token " with nothing behind it. */
function describeToken(char: string): string {
  const code = char.codePointAt(0) ?? 0;
  if (code === 0xa0) return "Unexpected non-breaking space";
  if (code === 0xfeff) return "Unexpected byte order mark";
  if (code === 0x200b) return "Unexpected zero-width space";
  if (UNSEEN.test(char)) return `Unexpected character U+${code.toString(16).toUpperCase().padStart(4, "0")}`;
  return `Unexpected token ${char}`;
}

/** Reads one token at a time, so that a mistake is reported in the order it appears in the text, whether it is in a word or in the structure. */
class Lexer {
  readonly tokens: Token[] = [];
  /** Where the token before the last one read ends: a missing comma belongs there. */
  before = 0;
  /** Where the last token read ends: a value that never comes is missing there. */
  end = 0;
  private text: string;
  private at = 0;
  private ahead: Token | null | undefined;

  constructor(text: string) {
    this.text = text;
  }

  peek(): Token | null {
    if (this.ahead === undefined) this.ahead = this.read();
    return this.ahead;
  }

  next(): Token | null {
    const token = this.peek();
    this.ahead = undefined;
    if (token) {
      this.before = this.end;
      this.end = token.end;
      this.tokens.push(token);
    }
    return token;
  }

  private read(): Token | null {
    const { text } = this;
    while (this.at < text.length && " \t\n\r".includes(text.charAt(this.at))) this.at += 1;
    if (this.at >= text.length) return null;
    const start = this.at;
    const char = text.charAt(start);
    let end: number;
    let kind: TokenKind;
    if ("{}[],:".includes(char)) {
      end = start + 1;
      kind = "punct";
    } else if (char === '"') {
      end = this.string(start);
      kind = "string";
    } else if (char === "'") {
      return fail("Strings need double quotes, not single quotes", start);
    } else if (char === "/" && (text.charAt(start + 1) === "/" || text.charAt(start + 1) === "*")) {
      return fail("JSON does not allow comments", start);
    } else if (char === "-" || isDigit(char)) {
      end = this.number(start);
      kind = "number";
    } else if (isWord(char)) {
      end = start + 1;
      while (end < text.length && /[\w$]/.test(text.charAt(end))) end += 1;
      const word = text.slice(start, end);
      kind = word === "true" || word === "false" || word === "null" ? "literal" : "word";
    } else {
      // A whole code point, so an emoji is named as itself and not as half of a surrogate pair.
      return fail(describeToken(String.fromCodePoint(text.codePointAt(start) ?? 0)), start);
    }
    this.at = end;
    return { kind, text: text.slice(start, end), start, end };
  }

  /** The end of the string that starts at `start`. */
  private string(start: number): number {
    const { text } = this;
    let at = start + 1;
    while (at < text.length) {
      const char = text.charAt(at);
      if (char === '"') return at + 1;
      if (char === "\\") {
        const escaped = text.charAt(at + 1);
        if (escaped === "u") {
          if (!/^[\da-fA-F]{4}$/.test(text.slice(at + 2, at + 6))) fail("Invalid \\u escape in a string", at);
          at += 6;
        } else if (escaped !== "" && '"\\/bfnrt'.includes(escaped)) {
          at += 2;
        } else {
          return fail(escaped === "" ? "String is not closed" : `Invalid escape \\${escaped} in a string`, escaped === "" ? start : at);
        }
        continue;
      }
      if (char === "\n" || char === "\r") return fail("String is not closed before the end of the line", start);
      if (char < " ") return fail("Control characters in a string must be escaped", at);
      at += 1;
    }
    return fail("String is not closed", start);
  }

  /** The end of the number that starts at `start`. */
  private number(start: number): number {
    const { text } = this;
    let at = start;
    if (text.charAt(at) === "-") at += 1;
    if (text.charAt(at) === "0") {
      at += 1;
      if (isDigit(text.charAt(at))) fail("Numbers cannot start with a zero", start);
    } else if (isDigit(text.charAt(at))) {
      while (isDigit(text.charAt(at))) at += 1;
    } else {
      fail("A minus sign needs digits behind it", start);
    }
    if (text.charAt(at) === ".") {
      at += 1;
      if (!isDigit(text.charAt(at))) fail("A number needs digits after the decimal point", at - 1);
      while (isDigit(text.charAt(at))) at += 1;
    }
    if (text.charAt(at) === "e" || text.charAt(at) === "E") {
      at += 1;
      if (text.charAt(at) === "+" || text.charAt(at) === "-") at += 1;
      if (!isDigit(text.charAt(at))) fail("An exponent needs digits", at - 1);
      while (isDigit(text.charAt(at))) at += 1;
    }
    return at;
  }
}

const unclosed = (open: Token) => new Mistake(`Missing ${open.text === "{" ? "}" : "]"} for the ${open.text}`, open.start);

function value(lexer: Lexer, depth: number): void {
  const token = lexer.next();
  if (!token) throw new Mistake("Unexpected end of the JSON", lexer.end);
  if (token.kind === "word") fail(WORDS[token.text] ?? `Unexpected "${token.text}"`, token.start);
  if (token.kind !== "punct") return;
  if (token.text === "{") return object(lexer, token, depth + 1);
  if (token.text === "[") return array(lexer, token, depth + 1);
  fail(`Unexpected token ${token.text}`, token.start);
}

function object(lexer: Lexer, open: Token, depth: number): void {
  if (depth > MAX_DEPTH) fail("Nested too deeply", open.start);
  if (isPunct(lexer.peek(), "}")) {
    lexer.next();
    return;
  }
  let comma: Token | null = null;
  for (;;) {
    const key = lexer.next();
    if (!key) throw unclosed(open);
    if (isPunct(key, "}") && comma) fail("Trailing comma before }", comma.start);
    if (key.kind !== "string") fail("Expected a property name in double quotes", key.start);
    const colon = lexer.next();
    if (!colon) throw unclosed(open);
    if (!isPunct(colon, ":")) fail("Expected : after the property name", colon.start);
    value(lexer, depth);
    const after = lexer.next();
    if (!after) throw unclosed(open);
    if (isPunct(after, "}")) return;
    if (isPunct(after, ",")) {
      comma = after;
      continue;
    }
    fail(startsValue(after) ? "Missing comma" : `Expected , or } but found ${after.text}`, startsValue(after) ? lexer.before : after.start);
  }
}

function array(lexer: Lexer, open: Token, depth: number): void {
  if (depth > MAX_DEPTH) fail("Nested too deeply", open.start);
  if (isPunct(lexer.peek(), "]")) {
    lexer.next();
    return;
  }
  let comma: Token | null = null;
  for (;;) {
    const first = lexer.peek();
    if (!first) throw unclosed(open);
    if (isPunct(first, "]") && comma) fail("Trailing comma before ]", comma.start);
    value(lexer, depth);
    const after = lexer.next();
    if (!after) throw unclosed(open);
    if (isPunct(after, "]")) return;
    if (isPunct(after, ",")) {
      comma = after;
      continue;
    }
    fail(startsValue(after) ? "Missing comma" : `Expected , or ] but found ${after.text}`, startsValue(after) ? lexer.before : after.start);
  }
}

/** The line and column (both from 1) of a position between characters. */
export function positionOf(text: string, offset: number): { line: number; column: number } {
  let line = 1;
  let lineStart = 0;
  const stop = Math.min(offset, text.length);
  for (let at = text.indexOf("\n"); at !== -1 && at < stop; at = text.indexOf("\n", at + 1)) {
    line += 1;
    lineStart = at + 1;
  }
  return { line, column: stop - lineStart + 1 };
}

/** Reads the whole text as one JSON value, and throws the first mistake. */
function read(text: string): Lexer {
  const lexer = new Lexer(text);
  value(lexer, 0);
  const extra = lexer.next();
  if (extra) fail("Unexpected content after the end of the JSON", extra.start);
  return lexer;
}

/**
 * Checks a text as JSON and names the first mistake with its line and column,
 * in plain words and the same words in every browser: a trailing comma, a
 * missing comma, single quotes, a comment, an unclosed bracket. It does not
 * depend on the message JSON.parse gives, which differs from one engine to
 * the next. A text with nothing in it is not a mistake.
 */
export function validateJson(text: string): CodeValidation {
  if (text.trim() === "") return { valid: true, empty: true };
  try {
    read(text);
    return { valid: true, empty: false };
  } catch (error) {
    if (!(error instanceof Mistake)) throw error;
    const { line, column } = positionOf(text, error.offset);
    return { valid: false, message: `${error.message} at line ${line}, column ${column}`, line, column, offset: error.offset };
  }
}

/**
 * Pretty-prints valid JSON, one level of `indent` per depth, or returns null
 * when the text is not valid. It works on the tokens and not on parsed
 * values, so a number such as 12345678901234567890 or 1.50 keeps every digit
 * it was written with, and the order of the keys is untouched.
 */
export function formatJson(text: string, indent = "  "): string | null {
  if (text.trim() === "") return null;
  let tokens: Token[];
  try {
    tokens = read(text).tokens;
  } catch (error) {
    if (error instanceof Mistake) return null;
    throw error;
  }
  let out = "";
  let depth = 0;
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (!token) continue;
    if (token.kind !== "punct") {
      out += token.text;
    } else if (token.text === "{" || token.text === "[") {
      const next = tokens[index + 1];
      if (next && next.kind === "punct" && (next.text === "}" || next.text === "]")) {
        out += token.text + next.text;
        index += 1;
      } else {
        depth += 1;
        out += `${token.text}\n${indent.repeat(depth)}`;
      }
    } else if (token.text === "}" || token.text === "]") {
      depth -= 1;
      out += `\n${indent.repeat(depth)}${token.text}`;
    } else if (token.text === ",") {
      out += `,\n${indent.repeat(depth)}`;
    } else {
      out += ": ";
    }
  }
  return out;
}
