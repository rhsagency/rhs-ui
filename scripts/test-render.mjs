/**
 * Server rendering for every demo. Each registry:example is bundled with the
 * same aliases a consumer uses and rendered with renderToString, the way a
 * Next Server Component page renders it before hydration. Typecheck cannot
 * see a component that throws during SSR (the Slot regression of 0.2 only
 * showed up there), so this renders all of them, not a sample.
 *
 * Also the select rule, measured on the HTML: a native <select> may only be
 * Radix's form mirror, aria-hidden and out of the tab order. Anything else is
 * the browser's own menu, which RHS UI never shows.
 *
 * Run: pnpm test:render
 */
import assert from "node:assert/strict";
import { build } from "esbuild";
import { mkdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const out = path.join(root, ".scratch", "render-all.cjs");
mkdirSync(path.dirname(out), { recursive: true });

const registry = JSON.parse(readFileSync(path.join(root, "registry.json"), "utf8"));
const demos = registry.items.filter((item) => item.type === "registry:example");
assert.ok(demos.length > 0, "no demos found: run pnpm registry:build first");

/** Every <select> in the markup must be the hidden form mirror. */
export function selectProblems(html) {
  return [...html.matchAll(/<select\b[^>]*>/g)]
    .map(([tag]) => tag)
    .filter((tag) => !/aria-hidden="true"/.test(tag) || !/tabindex="-1"/.test(tag))
    .map((tag) => `native select that can be seen or reached: ${tag.slice(0, 80)}`);
}

export const headingProblems = (html) => /<h1[\s>]/.test(html);

const entry = [
  'import { createElement } from "react";',
  'import { renderToString } from "react-dom/server";',
  ...demos.map((demo, i) => `import Demo${i} from ${JSON.stringify("./" + demo.files[0].path.replace(/\.tsx?$/, ""))};`),
  `export const DEMOS = [${demos.map((demo, i) => `[${JSON.stringify(demo.name)}, Demo${i}]`).join(", ")}];`,
  "export function render(Component) { return renderToString(createElement(Component)); }",
].join("\n");

await build({
  stdin: { contents: entry, resolveDir: root, loader: "tsx" },
  bundle: true,
  platform: "node",
  format: "cjs",
  jsx: "automatic",
  packages: "external",
  alias: { "@rhs-ui": "./registry", "@/lib/utils": "./dev/lib/utils" },
  outfile: out,
  logLevel: "error",
});

const { DEMOS, render } = createRequire(out)(out);
const failures = [];
for (const [name, Demo] of DEMOS) {
  try {
    const html = render(Demo);
    if (!html.trim()) failures.push(`${name}: rendered nothing`);
    // A demo is not a page: rhsui.com shows many on one page, which has its own h1.
    if (headingProblems(html)) failures.push(`${name}: renders an h1; a demo uses h2 and below`);
    for (const problem of selectProblems(html)) failures.push(`${name}: ${problem}`);
  } catch (error) {
    failures.push(`${name}: throws during server rendering: ${error instanceof Error ? error.message.split("\n")[0] : error}`);
  }
}

// Negative controls: the select rule must catch a visible native select and pass the mirror.
assert.equal(selectProblems('<select name="country"><option>NL</option></select>').length, 1);
assert.equal(selectProblems('<select aria-hidden="true" tabindex="-1" name="country"></select>').length, 0);
assert.equal(headingProblems('<section><h1 class="x">Hero</h1></section>'), true);
assert.equal(headingProblems("<h2>Section</h2><header>no heading</header>"), false);

for (const failure of failures) console.log(`FAIL ${failure}`);
if (failures.length) {
  console.log(`test-render: ${failures.length} failure(s) in ${DEMOS.length} demos`);
  process.exit(1);
}
console.log(`test-render: ${DEMOS.length} demos render on the server; native selects are only the hidden form mirror (2 negative controls passed)`);
