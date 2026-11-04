/**
 * The component index: one published file per release, `public/r/component-index.json` (served at
 * https://rhsui.com/r/component-index.json), that tools read instead of this repository's source. RHS Orbit's planner
 * and generator, a read-only MCP server and a customer's own tooling all answer from it.
 *
 *   items    every Free item a project can install: name, kind, group, one-line description (the compact catalogue)
 *   entries  the same items plus the icon set, each with its import path, exported components and their props, a
 *            usage example from its demo and what it depends on (component-index.mjs)
 *   theme    the light and dark tokens of rhs-ui-theme
 *
 * Only Free, MIT items: Pro and examples never appear. Deterministic: the same registry gives the same bytes, so a
 * consumer's prompt cache only moves when the registry does. `format` changes only when a field changes meaning; the
 * contract test (check-contract.mjs) guards that nothing a release had is gone.
 *
 * build-registry.mjs writes it on every build. For another checkout (a release's contract baseline):
 *   node scripts/component-index-file.mjs --root <checkout> --out <file>
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { KIND_ORDER, kindOf } from "./catalogue-kind.mjs";
import { buildIndex } from "./component-index.mjs";

export const INDEX_FORMAT = 1;
export const INDEX_PATH = path.join("public", "r", "component-index.json");

const NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** The index of the registry at `root` (a checkout with registry.json, package.json and the item sources). */
export function componentIndex(root) {
  const registry = JSON.parse(readFileSync(path.join(root, "registry.json"), "utf8"));
  const pkg = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));
  const items = [];
  for (const item of registry.items ?? []) {
    const kind = kindOf(item);
    if (!kind || item.name.endsWith("-demo")) continue;
    if (item.meta?.tier && item.meta.tier !== "free") continue;
    if (!NAME.test(item.name)) throw new Error(`component index: unexpected item name "${item.name}"`);
    const description = String(item.description ?? "").replace(/\s+/g, " ").trim().slice(0, 240);
    if (!description) throw new Error(`component index: item "${item.name}" has no description`);
    items.push({ name: item.name, kind, group: item.meta?.family ?? item.categories?.[1] ?? item.categories?.[0] ?? kind, description });
  }
  items.sort((a, b) => KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind) || a.group.localeCompare(b.group) || a.name.localeCompare(b.name));
  if (new Set(items.map((item) => item.name)).size !== items.length) throw new Error("component index: duplicate item names in the registry");
  if (items.filter((item) => item.kind === "block").length < 20) throw new Error("component index: fewer than 20 blocks: is this the right registry?");
  const theme = (registry.items ?? []).find((item) => item.name === "rhs-ui-theme");
  if (!theme?.cssVars?.light || !theme.cssVars.dark) throw new Error("component index: the registry has no rhs-ui-theme with light and dark tokens");
  const entries = buildIndex({ registryRoot: root, registryItems: registry.items, names: [...items.map((item) => item.name), "icons"] });
  return { format: INDEX_FORMAT, source: { package: pkg.name, version: pkg.version }, theme: theme.cssVars, items, entries };
}

/** The file as it is committed: one line per item and entry keeps a diff readable without doubling the size. */
export function serializeIndex(index) {
  const lines = (list) => list.map((value) => `    ${JSON.stringify(value)}`).join(",\n");
  return [
    "{",
    `  "format": ${JSON.stringify(index.format)},`,
    `  "source": ${JSON.stringify(index.source)},`,
    `  "theme": ${JSON.stringify(index.theme)},`,
    `  "items": [\n${lines(index.items)}\n  ],`,
    `  "entries": [\n${lines(index.entries)}\n  ]`,
    "}",
    "",
  ].join("\n");
}

export function writeComponentIndex(root, out = path.join(root, INDEX_PATH)) {
  const index = componentIndex(root);
  writeFileSync(out, serializeIndex(index));
  return index;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const arg = (flag) => {
    const at = process.argv.indexOf(flag);
    return at > 0 ? process.argv[at + 1] : undefined;
  };
  const root = path.resolve(arg("--root") ?? path.resolve(import.meta.dirname, ".."));
  const index = writeComponentIndex(root, arg("--out") ? path.resolve(arg("--out")) : undefined);
  console.log(`component-index: ${index.items.length} items, ${index.entries.length} entries, ${index.entries.filter((entry) => entry.usage).length} with a usage example (rhs-ui ${index.source.version})`);
}
