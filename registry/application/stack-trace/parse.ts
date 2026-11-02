/**
 * The stack parsing behind StackTrace, as plain functions with no React: read
 * the text of a stack (V8's "at fn (file:1:2)", Firefox's and Safari's
 * "fn@file:1:2"), tell your own frames from library frames, write a path the
 * way a person wants to read it, and write a trace back as plain text. A
 * Server Component, a logger or a test can use them with the same results.
 */

/** One line of a stack. */
export interface StackFrame {
  /** The function, as the engine names it: "renderLineItems", "Object.<anonymous>", "new Cart", "async load". Empty for an anonymous frame. */
  fn?: string;
  /** The file or URL the frame is in, as the stack writes it. */
  file: string;
  line?: number;
  column?: number;
  /** Says whether the frame is library code. Leave it out and the path decides. */
  library?: boolean;
}

const hasLocation = /^(.*):(\d+):(\d+)$/;
const hasLine = /^(.*):(\d+)$/;

function located(fn: string | undefined, where: string): StackFrame {
  const name = fn?.trim() ? fn.trim() : undefined;
  const place = where.trim();
  const full = hasLocation.exec(place);
  if (full?.[1] !== undefined) return { fn: name, file: full[1], line: Number(full[2]), column: Number(full[3]) };
  const partial = hasLine.exec(place);
  if (partial?.[1] !== undefined) return { fn: name, file: partial[1], line: Number(partial[2]) };
  // "index 0" is what V8 writes for a frame inside Promise.all.
  return { fn: name, file: /^index \d+$/.test(place) ? "<anonymous>" : place };
}

function parseV8(line: string): StackFrame | null {
  const match = /^at\s+(.*)$/.exec(line);
  if (!match?.[1]) return null;
  const awaited = /^async\s+/.test(match[1]);
  const rest = match[1].replace(/^async\s+/, "");
  const called = /^(.*?)\s+\((.*)\)$/.exec(rest);
  const frame = called?.[1] !== undefined && called[2] !== undefined ? located(called[1], called[2]) : located(undefined, rest);
  return awaited && frame.fn ? { ...frame, fn: `async ${frame.fn}` } : frame;
}

function parseGecko(line: string): StackFrame | null {
  const at = line.indexOf("@");
  if (at < 0) return null;
  const where = line.slice(at + 1);
  // A line of prose with an @ in it is not a frame: a frame ends in a position or says it is native.
  if (!/(:\d+(:\d+)?|\[native code\])$/.test(where)) return null;
  return located(line.slice(0, at), where);
}

/** The frames in the text of a stack. The message line and anything that is not a frame are skipped. */
export function parseStack(stack: string): StackFrame[] {
  const frames: StackFrame[] = [];
  for (const raw of stack.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const frame = parseV8(line) ?? parseGecko(line);
    if (frame) frames.push(frame);
  }
  return frames;
}

// `node_modules_` is how a bundler names a chunk of library code in a browser trace ("chunks/node_modules_react-dom_client.js").
const LIBRARY_PATH = /(^|\/)node_modules[/_]|^node:|^internal\/|^<anonymous>$|^native$|^\[native code\]$|^webpack\/runtime|^\(internal\)/;

const slashes = (path: string) => path.replace(/\\/g, "/");

const isAbsolute = (path: string) => path.startsWith("/") || /^[A-Za-z]:\//.test(path);

/** A path the way a person reads it: no file:// or webpack prefix, and relative to the project root when it is inside it. */
export function displayPath(file: string, projectRoot?: string): string {
  let path = slashes(file)
    .replace(/^file:\/\//, "")
    .replace(/^\/([A-Za-z]:\/)/, "$1")
    .replace(/^webpack-internal:\/\/\/(?:\([^)]*\)\/)?(?:\.\/)?/, "")
    .replace(/^webpack:\/\/[^/]*\/(?:\.\/)?/, "");
  if (projectRoot) {
    const root = slashes(projectRoot).replace(/\/+$/, "");
    if (root && path.startsWith(`${root}/`)) path = path.slice(root.length + 1);
  }
  return path;
}

/** Whether a frame is library code: set by you with `library`, else decided by the path (node_modules, Node's own modules, native code, or anything outside the project root). */
export function isLibraryFrame(frame: StackFrame, projectRoot?: string): boolean {
  if (frame.library !== undefined) return frame.library;
  const path = displayPath(frame.file, projectRoot);
  if (LIBRARY_PATH.test(path)) return true;
  if (projectRoot && isAbsolute(path)) return true;
  return false;
}

/** "src/cart.tsx:42:13": the file with its line and column, the value to copy. */
export function locationOf(frame: StackFrame, projectRoot?: string): string {
  const path = displayPath(frame.file, projectRoot);
  if (frame.line === undefined) return path;
  return `${path}:${frame.line}${frame.column === undefined ? "" : `:${frame.column}`}`;
}

/** The packages a run of library frames comes from, in order of appearance: "react-dom", "next", "node". */
export function packagesOf(frames: readonly StackFrame[], projectRoot?: string): string[] {
  const names: string[] = [];
  for (const frame of frames) {
    const path = displayPath(frame.file, projectRoot);
    const found = [...path.matchAll(/node_modules\/((?:@[^/]+\/)?[^/]+)/g)].pop()?.[1];
    const name = found ?? (/^node:|^internal\//.test(path) ? "node" : undefined);
    if (name && !names.includes(name)) names.push(name);
  }
  return names;
}

/** A trace as plain text, the way an engine writes it, for pasting into an issue. */
export function traceText(error: { name?: string; message?: string }, frames: readonly StackFrame[], projectRoot?: string): string {
  const head = [error.name, error.message].filter(Boolean).join(": ");
  const lines = frames.map((frame) => `    at ${frame.fn ? `${frame.fn} (${locationOf(frame, projectRoot)})` : locationOf(frame, projectRoot)}`);
  return [head, ...lines].filter(Boolean).join("\n");
}

/** A frame, or a run of library frames that are folded together. */
export type FrameRow = { kind: "app"; frame: StackFrame; index: number } | { kind: "library"; frames: StackFrame[]; index: number };

/** The frames as rows: every frame of your own on its own, every run of library frames in one row. `index` is the position of the first frame of the row in the trace. */
export function rowsOf(frames: readonly StackFrame[], projectRoot?: string): FrameRow[] {
  const rows: FrameRow[] = [];
  frames.forEach((frame, index) => {
    const last = rows[rows.length - 1];
    if (isLibraryFrame(frame, projectRoot)) {
      if (last?.kind === "library") last.frames.push(frame);
      else rows.push({ kind: "library", frames: [frame], index });
    } else {
      rows.push({ kind: "app", frame, index });
    }
  });
  return rows;
}
