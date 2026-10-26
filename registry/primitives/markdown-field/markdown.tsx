import { createElement, type ComponentProps, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface MarkdownProps extends Omit<ComponentProps<"div">, "children"> {
  /** The Markdown to show: headings, emphasis, links, lists (one level deep), quotes, inline code and fenced code. Anything else is plain text. */
  text: string;
  /** The heading level a single # becomes, 1 to 5. Default 2, so a page that shows user text keeps its own h1; ## is one level below, down to h6. */
  headingLevel?: 1 | 2 | 3 | 4 | 5;
}

type Block =
  | { type: "heading"; level: number; text: string }
  | { type: "paragraph"; text: string }
  | { type: "quote"; blocks: Block[] }
  | { type: "list"; ordered: boolean; start: number; items: string[] }
  | { type: "code"; text: string };

const FENCE = /^ {0,3}(`{3,}|~{3,})\s*[\w+-]*\s*$/;
const HEADING = /^ {0,3}(#{1,6})[ \t]+(.*?)(?:[ \t]+#+)?[ \t]*$/;
const QUOTE_LINE = /^ {0,3}>/;
const BULLET_LINE = /^\s*[-*+][ \t]+(.*)$/;
const NUMBER_LINE = /^\s*(\d{1,9})[.)][ \t]+(.*)$/;

const startsBlock = (line: string) => FENCE.test(line) || HEADING.test(line) || QUOTE_LINE.test(line) || BULLET_LINE.test(line) || NUMBER_LINE.test(line);

/** The blocks of a text: what is on a line of its own (a heading, an item of a list, a quote, a fence) and what runs on from line to line (a paragraph). */
function parseBlocks(source: string): Block[] {
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  const blocks: Block[] = [];
  let index = 0;
  while (index < lines.length) {
    const line = lines[index] ?? "";
    if (line.trim() === "") {
      index += 1;
      continue;
    }
    const fence = FENCE.exec(line);
    if (fence) {
      const mark = fence[1] ?? "```";
      const body: string[] = [];
      index += 1;
      // The fence closes with at least as many of the same character, or at the end of the text.
      while (index < lines.length && !new RegExp(`^ {0,3}${mark.charAt(0) === "`" ? "`" : "~"}{${mark.length},}\\s*$`).test(lines[index] ?? "")) {
        body.push(lines[index] ?? "");
        index += 1;
      }
      index += 1;
      blocks.push({ type: "code", text: body.join("\n") });
      continue;
    }
    const heading = HEADING.exec(line);
    if (heading) {
      blocks.push({ type: "heading", level: (heading[1] ?? "#").length, text: heading[2] ?? "" });
      index += 1;
      continue;
    }
    if (QUOTE_LINE.test(line)) {
      const inner: string[] = [];
      while (index < lines.length && QUOTE_LINE.test(lines[index] ?? "")) {
        inner.push((lines[index] ?? "").replace(/^ {0,3}>[ \t]?/, ""));
        index += 1;
      }
      blocks.push({ type: "quote", blocks: parseBlocks(inner.join("\n")) });
      continue;
    }
    const bullet = BULLET_LINE.exec(line);
    const number = NUMBER_LINE.exec(line);
    if (bullet || number) {
      const ordered = Boolean(number);
      const start = number ? Number(number[1]) : 1;
      const items: string[] = [];
      while (index < lines.length) {
        const current = lines[index] ?? "";
        const item = ordered ? NUMBER_LINE.exec(current) : BULLET_LINE.exec(current);
        if (!item) {
          // A line that is indented and not a marker goes on with the item before it.
          if (items.length > 0 && /^\s+\S/.test(current) && !startsBlock(current)) {
            items[items.length - 1] += `\n${current.trim()}`;
            index += 1;
            continue;
          }
          break;
        }
        items.push((ordered ? item[2] : item[1]) ?? "");
        index += 1;
      }
      blocks.push({ type: "list", ordered, start, items });
      continue;
    }
    const paragraph: string[] = [];
    while (index < lines.length && (lines[index] ?? "").trim() !== "" && (paragraph.length === 0 || !startsBlock(lines[index] ?? ""))) {
      paragraph.push(lines[index] ?? "");
      index += 1;
    }
    blocks.push({ type: "paragraph", text: paragraph.map((row) => row.trim()).join("\n") });
  }
  return blocks;
}

const ESCAPABLE = "\\`*_{}[]()#+-.!|~<>";

/** A link target that is safe to put in an href: no script, no data. Web addresses, mail, phone numbers, anchors and paths are fine. */
function safeHref(raw: string): string | null {
  const url = raw.trim();
  if (!url) return null;
  // Control characters and spaces are dropped before the scheme is read, as a browser does, so "java script:" cannot hide.
  const compact = Array.from(url)
    .filter((char) => char.charCodeAt(0) > 32 && !(char.charCodeAt(0) >= 127 && char.charCodeAt(0) <= 159))
    .join("");
  const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(compact)?.[1]?.toLowerCase();
  if (scheme) return ["http", "https", "mailto", "tel"].includes(scheme) ? url : null;
  return url;
}

/** Where `[label](address)` starts at `from`: the label, the address and where it ends, or null when it is not a link. */
function readLink(text: string, from: number): { label: string; href: string; end: number } | null {
  let depth = 0;
  let close = -1;
  for (let at = from; at < text.length; at += 1) {
    const char = text.charAt(at);
    if (char === "\\") at += 1;
    else if (char === "[") depth += 1;
    else if (char === "]") {
      depth -= 1;
      if (depth === 0) {
        close = at;
        break;
      }
    }
  }
  if (close === -1 || text.charAt(close + 1) !== "(") return null;
  let parens = 1;
  let end = -1;
  for (let at = close + 2; at < text.length; at += 1) {
    const char = text.charAt(at);
    if (char === "\\") at += 1;
    else if (char === "(") parens += 1;
    else if (char === ")") {
      parens -= 1;
      if (parens === 0) {
        end = at;
        break;
      }
    }
  }
  if (end === -1) return null;
  // An address, optionally in <angle brackets>, and then perhaps a title in quotes, which is not shown. Anything else in the brackets means this is not a link.
  const inside = /^(<[^>]*>|\S+)(?:\s+(?:"[^"]*"|'[^']*'|\([^)]*\)))?$/.exec(text.slice(close + 2, end).trim());
  if (!inside) return null;
  return { label: text.slice(from + 1, close), href: (inside[1] ?? "").replace(/^<(.*)>$/, "$1"), end: end + 1 };
}

/** The index of the marker that closes a span opened with `size` of `mark`, or -1. Code spans and escapes are stepped over, and so are runs of another length. */
function findClose(text: string, from: number, mark: string, size: number): number {
  for (let at = from; at < text.length; at += 1) {
    const char = text.charAt(at);
    if (char === "\\") {
      at += 1;
    } else if (char === "`") {
      let run = 1;
      while (text.charAt(at + run) === "`") run += 1;
      const closing = text.indexOf("`".repeat(run), at + run);
      if (closing !== -1) at = closing + run - 1;
      else at += run - 1;
    } else if (char === mark) {
      let run = 1;
      while (text.charAt(at + run) === mark) run += 1;
      const before = text.charAt(at - 1);
      const after = text.charAt(at + run);
      const flanks = at > from && !/\s/.test(before);
      // An underscore inside a word is just a character: snake_case stays as it is.
      const inWord = mark === "_" && /[\p{L}\p{N}]/u.test(after);
      if (run === size && flanks && !inWord) return at;
      at += run - 1;
    }
  }
  return -1;
}

function renderInline(text: string, keyPrefix: string, inLink = false): ReactNode[] {
  const nodes: ReactNode[] = [];
  let buffer = "";
  let counter = 0;
  const key = () => `${keyPrefix}-${(counter += 1)}`;
  const flush = () => {
    if (buffer) nodes.push(buffer);
    buffer = "";
  };
  let at = 0;
  while (at < text.length) {
    const char = text.charAt(at);
    if (char === "\\" && at + 1 < text.length && ESCAPABLE.includes(text.charAt(at + 1))) {
      buffer += text.charAt(at + 1);
      at += 2;
      continue;
    }
    if (char === "\n") {
      flush();
      nodes.push(<br key={key()} />);
      at += 1;
      continue;
    }
    if (char === "`") {
      let run = 1;
      while (text.charAt(at + run) === "`") run += 1;
      const fence = "`".repeat(run);
      let closing = text.indexOf(fence, at + run);
      // The closing run must be as long as the opening one, not part of a longer one.
      while (closing !== -1 && text.charAt(closing + run) === "`") {
        let longer = run;
        while (text.charAt(closing + longer) === "`") longer += 1;
        closing = text.indexOf(fence, closing + longer);
      }
      if (closing !== -1) {
        flush();
        const inner = text.slice(at + run, closing);
        nodes.push(
          <code key={key()} className="rounded-[0.3rem] bg-muted px-1.5 py-0.5 font-mono text-[0.8125em] text-foreground">
            {inner.length > 2 && inner.startsWith(" ") && inner.endsWith(" ") ? inner.slice(1, -1) : inner}
          </code>,
        );
        at = closing + run;
        continue;
      }
      buffer += fence;
      at += run;
      continue;
    }
    if (char === "[" && !inLink) {
      const link = readLink(text, at);
      const href = link ? safeHref(link.href) : null;
      if (link && href) {
        flush();
        const external = /^(https?:)?\/\//i.test(href);
        nodes.push(
          <a
            key={key()}
            href={href}
            target={external ? "_blank" : undefined}
            rel={external ? "noopener noreferrer" : undefined}
            className="font-medium text-foreground underline decoration-foreground/30 underline-offset-4 transition-colors duration-150 motion-reduce:transition-none hover:decoration-foreground"
          >
            {renderInline(link.label, `${keyPrefix}-${counter}`, true)}
          </a>,
        );
        at = link.end;
        continue;
      }
    }
    if (char === "*" || char === "_") {
      let run = 1;
      while (text.charAt(at + run) === char) run += 1;
      const before = text.charAt(at - 1);
      const after = text.charAt(at + run);
      // An opening marker is followed by text, and an underscore is not an opening marker in the middle of a word.
      const opens = after !== "" && !/\s/.test(after) && !(char === "_" && /[\p{L}\p{N}]/u.test(before));
      if (opens && run <= 3) {
        let used = 0;
        let closeAt = -1;
        for (const size of run === 3 ? [3, 2, 1] : run === 2 ? [2, 1] : [1]) {
          closeAt = findClose(text, at + size, char, size);
          if (closeAt > at + size) {
            used = size;
            break;
          }
          closeAt = -1;
        }
        if (used > 0) {
          flush();
          const inner = renderInline(text.slice(at + used, closeAt), `${keyPrefix}-${counter + 1}`, inLink);
          const id = key();
          nodes.push(
            used === 3 ? (
              <strong key={id} className="font-semibold">
                <em>{inner}</em>
              </strong>
            ) : used === 2 ? (
              <strong key={id} className="font-semibold">
                {inner}
              </strong>
            ) : (
              <em key={id}>{inner}</em>
            ),
          );
          at = closeAt + used;
          continue;
        }
      }
      buffer += text.slice(at, at + run);
      at += run;
      continue;
    }
    buffer += char;
    at += 1;
  }
  flush();
  return nodes;
}

const HEADING_CLASS = ["text-xl", "text-lg", "text-base", "text-[0.9375rem]", "text-sm", "text-sm"] as const;

function renderBlocks(blocks: readonly Block[], keyPrefix: string, headingLevel: number): ReactNode[] {
  return blocks.map((block, index) => {
    const key = `${keyPrefix}-${index}`;
    switch (block.type) {
      case "heading": {
        const level = Math.min(6, headingLevel + block.level - 1);
        return createElement(`h${level}`, { key, className: cn("font-semibold tracking-[-0.015em] text-foreground", HEADING_CLASS[level - 1]) }, renderInline(block.text, key));
      }
      case "paragraph":
        return <p key={key}>{renderInline(block.text, key)}</p>;
      case "quote":
        return (
          <blockquote key={key} className="grid gap-2 border-l-2 border-border pl-3 text-muted-foreground">
            {renderBlocks(block.blocks, key, headingLevel)}
          </blockquote>
        );
      case "list": {
        const items = block.items.map((item, position) => <li key={`${key}-${position}`}>{renderInline(item, `${key}-${position}`)}</li>);
        return block.ordered ? (
          <ol key={key} start={block.start} className="list-decimal space-y-1 pl-5 marker:text-muted-foreground marker:tabular-nums">
            {items}
          </ol>
        ) : (
          <ul key={key} className="list-disc space-y-1 pl-5 marker:text-muted-foreground">
            {items}
          </ul>
        );
      }
      case "code":
        return (
          <pre
            key={key}
            // A block that scrolls sideways must be reachable by keyboard too.
            tabIndex={0}
            className="relative overflow-x-auto rounded-lg border border-border bg-muted/50 p-3 font-mono text-[0.8125rem] leading-relaxed text-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
          >
            <code>{block.text}</code>
          </pre>
        );
    }
  });
}

/**
 * The small subset of Markdown that a writing box needs, shown as React
 * elements: headings, bold and italic, links, bulleted and numbered lists,
 * quotes, inline code and fenced code, with a single line break kept as a line
 * break. It never produces raw HTML, so markup in the text is just text, and a
 * link whose address is script or data is not made a link at all: what was
 * written stays on the page as plain text. Lists are one level deep, so an
 * indented item is shown flat, at the level of the others. Headings start at h2
 * by default, so a page that shows user text keeps one h1 of its own. Use it
 * for the Preview of the Markdown field, and anywhere the saved text is shown
 * again, so it looks the same in both places.
 */
export function Markdown({ text, headingLevel = 2, className, ...props }: MarkdownProps) {
  return (
    <div data-slot="markdown" className={cn("grid gap-3 text-sm leading-relaxed break-words text-foreground", className)} {...props}>
      {renderBlocks(parseBlocks(text), "md", headingLevel)}
    </div>
  );
}
