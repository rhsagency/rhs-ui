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

const root = path.resolve(import.meta.dirname, "..");
const out = path.join(root, "public", "r");

export const CATEGORY_ORDER = ["primitives", "icons", "commerce", "dashboard", "application", "marketing", "templates", "models", "backgrounds"];

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

const items = loadFragments().map(({ __fragment, ...item }) => item);
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
console.log(`build-registry: ${built.length} item(s) in public/r, catalogue with ${items.length} entries`);
