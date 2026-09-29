/**
 * Builds the distributable registry.
 *
 *   registry/<category>.json  (the source, one owner per file)
 *     -> registry.json          (generated root: every item, root-relative paths; committed)
 *     -> public/r/<name>.json   (shadcn build: file contents inlined; committed)
 *     -> public/r/registry.json (the catalogue the CLI's list/search read)
 *
 * The shadcn `include` mechanism cannot reference files above a fragment's
 * own folder, and this repository keeps one source tree for every category,
 * so the fragments are merged into the root here instead. CI fails when any
 * generated file is stale (`pnpm check:built`).
 *
 * Run: pnpm registry:build
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

import { familyOf } from "./families.mjs";

const root = path.resolve(import.meta.dirname, "..");
const out = path.join(root, "public", "r");

export const CATEGORY_ORDER = ["primitives", "icons", "commerce", "dashboard", "application", "marketing", "templates", "models", "backgrounds", "motion"];

/** Every category folder carries its own registry.json with the entries it owns. */
export function loadFragments() {
  const categories = readdirSync(path.join(root, "registry"), { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(path.join(root, "registry", entry.name, "registry.json")))
    .map((entry) => entry.name);
  const order = (category) => {
    const i = CATEGORY_ORDER.indexOf(category);
    return i === -1 ? 99 : i;
  };
  const items = [];
  for (const category of categories.sort((a, b) => order(a) - order(b) || a.localeCompare(b))) {
    const fragment = JSON.parse(readFileSync(path.join(root, "registry", category, "registry.json"), "utf8"));
    for (const item of fragment.items ?? []) items.push({ ...item, __fragment: category });
  }
  return items;
}

// meta.family is derived (scripts/families.mjs), so the fragments never carry it.
const items = loadFragments().map(({ __fragment, ...item }) => {
  const family = item.type === "registry:example" ? undefined : familyOf(item);
  return family ? { ...item, meta: { ...item.meta, family } } : item;
});
const registry = { $schema: "https://ui.shadcn.com/schema/registry.json", name: "rhs-ui", homepage: "https://rhsui.com", items };
writeFileSync(path.join(root, "registry.json"), JSON.stringify(registry, null, 2) + "\n");

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

const shadcnBin = path.join(root, "node_modules", ".bin", process.platform === "win32" ? "shadcn.cmd" : "shadcn");
if (!existsSync(shadcnBin)) {
  console.error("build-registry: shadcn is not installed. Run pnpm install.");
  process.exit(1);
}
execFileSync(shadcnBin, ["build", "registry.json", "--output", "public/r"], { cwd: root, stdio: "inherit", shell: process.platform === "win32" });

writeFileSync(path.join(out, "registry.json"), JSON.stringify(registry, null, 2) + "\n");

const built = readdirSync(out).filter((f) => f.endsWith(".json") && f !== "registry.json");
const missing = items.map((i) => i.name).filter((n) => !built.includes(`${n}.json`));
if (missing.length) {
  console.error(`build-registry: no output for ${missing.join(", ")}`);
  process.exit(1);
}

// The README's catalogue table, generated so it can never fall behind the
// registry. It lives between two markers; everything else is hand-written.
const CATEGORY_TEXT = {
  primitives: ["Primitives", "The building blocks, one job each"],
  icons: ["Icons", ""],
  commerce: ["Commerce", "Shop UI"],
  dashboard: ["Dashboard", "Dashboards and admin screens"],
  application: ["Application", "Application UI and account screens"],
  marketing: ["Marketing", "Page sections, from the navbar to the footer"],
  templates: ["Templates", "Complete pages"],
  models: ["Models", "3D model recipes and the viewer"],
  backgrounds: ["Backgrounds", "Living canvas backgrounds"],
  motion: ["Motion", "Scroll-driven reveals, parallax and reading progress"],
};
for (const category of CATEGORY_ORDER) {
  if (!CATEGORY_TEXT[category]) throw new Error(`build-registry: category "${category}" has no README text in CATEGORY_TEXT`);
}
const publicItems = items.filter((i) => i.type !== "registry:example" && i.type !== "registry:internal");
const glyphs = (readFileSync(path.join(root, "registry", "icons", "index.tsx"), "utf8").match(/^export const Icon\w+/gm) ?? []).length;
const animated = publicItems.filter((i) => i.categories?.[0] === "icons" && i.meta?.motion).length;
const rows = CATEGORY_ORDER.map((category) => {
  const [label, text] = CATEGORY_TEXT[category] ?? [category, ""];
  const names = publicItems.filter((i) => i.categories?.[0] === category).map((i) => i.name).sort();
  if (!names.length) return null;
  const what = category === "icons"
    ? `${glyphs} glyphs in one drawing hand, and ${animated} animated icons at \`@rhs-ui/icons/animated/<name>\``
    : `${text}: ${names.join(", ")}`;
  const importPath = category === "icons" ? "`@rhs-ui/icons`" : `\`@rhs-ui/${category}/<name>\``;
  return `| ${label} | ${importPath} | ${what} |`;
}).filter(Boolean);
const table = ["| Category | Import | What is in it |", "| --- | --- | --- |", ...rows].join("\n");
const readmePath = path.join(root, "README.md");
const readme = readFileSync(readmePath, "utf8");
const block = /<!-- catalogue:begin -->[\s\S]*?<!-- catalogue:end -->/;
if (!block.test(readme)) {
  console.error("build-registry: README.md has no <!-- catalogue:begin --> ... <!-- catalogue:end --> block");
  process.exit(1);
}
writeFileSync(readmePath, readme.replace(block, `<!-- catalogue:begin -->\n${table}\n<!-- catalogue:end -->`));

console.log(`build-registry: ${built.length} item(s) in public/r, catalogue with ${items.length} entries, README table with ${rows.length} categories`);
