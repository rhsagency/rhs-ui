/**
 * The batch kit: check new registry items and look at them before they join
 * the registry. A batch is a manifest of registry entries (the items and a
 * demo for each) next to new source files; no registry.json changes until
 * `merge`, so many batches can be built side by side without touching a
 * shared file.
 *
 *   node scripts/batch.mjs check <manifest.json> [--no-shots]
 *       1. the registry rules of check-registry.mjs for the batch, against the
 *          whole registry (names, files, imports, dependencies, families);
 *       2. a typecheck of the batch files and everything they import;
 *       3. a server render of every demo (no h1, no visible native select);
 *       4. every demo in a browser: light and dark at 1280, light at 390,
 *          console and page errors, horizontal overflow on the phone, an
 *          empty render, and a press of every button. One contact sheet per
 *          demo: .scratch/batches/<id>/sheet-<demo>.png. LOOK at them.
 *
 *   node scripts/batch.mjs merge <manifest.json...>
 *       append the entries to registry/<category>/registry.json (a demo goes
 *       to the fragment of the item it shows).
 *
 *   node scripts/batch.mjs shots <demo-name...>
 *       contact sheets for demos already in the registry, nothing checked.
 *
 * The manifest: { "id": "f8-forms-01", "items": [ <registry entries> ] }.
 * Playwright comes from ../rhs-ui-website and the Tailwind CLI from
 * ../rhs-ui-pro (the same versions the site and the Pro release use); the
 * tokens are rhsui.com's own, so a sheet looks like the site's preview.
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

import { checkItems, groupNameProblems, loadItems, registrySourcesOf } from "./check-registry.mjs";

const root = path.resolve(import.meta.dirname, "..");
const website = path.resolve(root, "..", "rhs-ui-website");
const pro = path.resolve(root, "..", "rhs-ui-pro");
const slash = (p) => p.split(path.sep).join("/");
const NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_SHOT = { desktop: 2200, mobile: 2600 };

const [command, ...rest] = process.argv.slice(2);
const flags = new Set(rest.filter((a) => a.startsWith("--")));
const args = rest.filter((a) => !a.startsWith("--"));

function readManifest(file) {
  const manifest = JSON.parse(readFileSync(path.resolve(file), "utf8"));
  if (!NAME.test(manifest.id ?? "")) throw new Error(`${file}: "id" must be kebab-case`);
  if (!Array.isArray(manifest.items) || !manifest.items.length) throw new Error(`${file}: "items" must be a non-empty array`);
  return manifest;
}

const isExample = (item) => item.type === "registry:example";

/** The fragment an entry belongs in: its own category, or for a demo the category of the item it shows. */
function fragmentOf(item, byName) {
  if (!isExample(item)) return item.categories?.[0];
  const shown = byName.get(item.name.replace(/-demo$/, ""));
  return shown?.categories?.[0];
}

/** Rules for a batch that the registry gate cannot know: every item ships with its demo, named and wired as the site expects. */
function manifestProblems(manifest) {
  const problems = [];
  const names = new Set(manifest.items.map((i) => i.name));
  for (const item of manifest.items) {
    const p = (msg) => problems.push(`${item.name}: ${msg}`);
    if (!NAME.test(item.name ?? "")) p("name must be kebab-case");
    if (isExample(item)) {
      const shown = item.name.replace(/-demo$/, "");
      if (!item.name.endsWith("-demo")) p("a demo is named <item>-demo");
      if (item.files?.[0]?.path !== `registry/examples/${item.name}.tsx`) p(`a demo lives at registry/examples/${item.name}.tsx`);
      if (!(item.registryDependencies ?? []).includes(`https://rhsui.com/r/${shown}.json`)) p(`a demo depends on https://rhsui.com/r/${shown}.json`);
      continue;
    }
    if (!names.has(`${item.name}-demo`)) p(`has no demo; add ${item.name}-demo to the batch`);
    // Builders work side by side: a file named after something else (a shared helper) can be overwritten by another batch.
    const own = `registry/${item.categories?.[0]}/${item.name}`;
    for (const f of item.files ?? []) if (f.path !== `${own}.tsx` && f.path !== `${own}.ts` && !f.path.startsWith(`${own}/`)) p(`${f.path}: an item's files are ${own}.tsx or live in the folder ${own}/`);
    if (item.meta?.tier !== "free") p('meta.tier must be "free"');
    if (!["inline", "frame"].includes(item.meta?.preview)) p('meta.preview must be "inline" (a component) or "frame" (a section, anything fixed or sticky)');
  }
  return problems;
}

function registryPhase(manifest) {
  const existing = loadItems();
  const batchNames = new Set(manifest.items.map((i) => i.name));
  const problems = [];
  // Re-checking after a merge finds the same entries in the fragments; a different entry under the same name is a clash.
  for (const old of existing.filter((i) => batchNames.has(i.name))) {
    const mine = manifest.items.find((i) => i.name === old.name);
    if (JSON.stringify(old.files) !== JSON.stringify(mine.files)) problems.push(`${old.name}: the name is taken by an item in registry/${old.__fragment}/registry.json`);
  }
  const byName = new Map([...existing, ...manifest.items].map((i) => [i.name, i]));
  const merged = [
    ...existing.filter((i) => !batchNames.has(i.name)),
    ...manifest.items.map((i) => ({ ...i, __fragment: fragmentOf(i, byName) })),
  ];
  problems.push(...checkItems(merged).filter((pr) => batchNames.has(pr.split(":")[0])));
  const batchFiles = new Set(manifest.items.flatMap((i) => (i.files ?? []).map((f) => f.path)));
  problems.push(...groupNameProblems(registrySourcesOf(merged)).filter((pr) => batchFiles.has(pr.split(":")[0])));
  problems.push(...manifestProblems(manifest));
  return { problems, all: merged };
}

function typePhase(manifest, out) {
  const files = manifest.items.flatMap((i) => (i.files ?? []).map((f) => path.join(root, f.path))).filter((f) => existsSync(f));
  const config = path.join(out, "tsconfig.json");
  writeFileSync(config, JSON.stringify({ extends: slash(path.join(root, "tsconfig.json")), compilerOptions: { noEmit: true, incremental: false }, files: files.map(slash), include: [] }, null, 2));
  const run = spawnSync(process.execPath, [path.join(root, "node_modules", "typescript", "bin", "tsc"), "-p", config, "--pretty", "false"], { cwd: root, encoding: "utf8" });
  return (run.stdout + run.stderr).split("\n").map((l) => l.trim()).filter((l) => /error TS\d+/.test(l));
}

const aliases = { "@rhs-ui": "./registry", "@/lib/utils": "./dev/lib/utils" };

async function renderPhase(demos, all, out) {
  const pages = new Set(all.filter((i) => i.categories?.[0] === "templates").map((i) => `${i.name}-demo`));
  const file = path.join(out, "render.cjs");
  await build({
    // The aliases are relative: resolve them against this repository, not the caller's cwd.
    absWorkingDir: root,
    stdin: {
      contents: [
        'import { createElement } from "react";',
        'import { renderToString } from "react-dom/server";',
        ...demos.map((d, i) => `import D${i} from ${JSON.stringify("./" + d.files[0].path.replace(/\.tsx?$/, ""))};`),
        `export const DEMOS = [${demos.map((d, i) => `[${JSON.stringify(d.name)}, D${i}]`).join(", ")}];`,
        "export const render = (C) => renderToString(createElement(C));",
      ].join("\n"),
      resolveDir: root,
      loader: "tsx",
    },
    bundle: true,
    platform: "node",
    format: "cjs",
    jsx: "automatic",
    packages: "external",
    alias: aliases,
    outfile: file,
    logLevel: "silent",
  });
  const { DEMOS, render } = createRequire(file)(file);
  const failures = [];
  for (const [name, Demo] of DEMOS) {
    try {
      const html = render(Demo);
      if (!html.trim()) failures.push(`${name}: rendered nothing on the server`);
      const h1s = (html.match(/<h1[\s>]/g) ?? []).length;
      if (pages.has(name) ? h1s !== 1 : h1s > 0) failures.push(`${name}: ${pages.has(name) ? "a page template renders exactly one h1" : "renders an h1; a demo uses h2 and below"}`);
      for (const tag of html.match(/<select\b[^>]*>/g) ?? []) {
        if (!/aria-hidden="true"/.test(tag) || !/tabindex="-1"/.test(tag)) failures.push(`${name}: a visible native <select>; use Select from @rhs-ui/primitives/select`);
      }
    } catch (error) {
      failures.push(`${name}: throws during server rendering: ${String(error?.message ?? error).split("\n")[0]}`);
    }
  }
  return failures;
}

/** The motion layer every item declares, as the shadcn CLI would write it into a consumer's globals.css. */
function themeLayer(all) {
  const lines = [];
  const seen = new Set();
  const decl = (body) => Object.entries(body).map(([k, v]) => `${k}: ${v};`).join(" ");
  for (const item of all) {
    for (const [name, value] of Object.entries(item.cssVars?.theme ?? {})) {
      if (name.startsWith("animate-") && !seen.has(name)) lines.push(`  --${name}: ${value};`), seen.add(name);
    }
    for (const [rule, body] of Object.entries(item.css ?? {})) {
      if (rule.startsWith("@keyframes ") && !seen.has(rule)) lines.push(`  ${rule} { ${Object.entries(body).map(([step, props]) => `${step} { ${decl(props)} }`).join(" ")} }`), seen.add(rule);
    }
  }
  return ["@theme {", ...lines, "}"].join("\n");
}

async function buildHarness(demos, all, out) {
  const frame = new Set(all.filter((i) => i.meta?.preview === "frame").map((i) => `${i.name}-demo`));
  await build({
    // The aliases are relative: resolve them against this repository, not the caller's cwd.
    absWorkingDir: root,
    stdin: {
      contents: [
        'import { createElement, StrictMode } from "react";',
        'import { createRoot } from "react-dom/client";',
        ...demos.map((d, i) => `import D${i} from ${JSON.stringify("./" + d.files[0].path.replace(/\.tsx?$/, ""))};`),
        `const DEMOS = { ${demos.map((d, i) => `${JSON.stringify(d.name)}: D${i}`).join(", ")} };`,
        `const FRAME = new Set(${JSON.stringify([...frame])});`,
        "const q = new URLSearchParams(location.search);",
        'const name = q.get("demo");',
        'document.documentElement.classList.toggle("dark", q.get("theme") === "dark");',
        'const stage = document.getElementById("root");',
        'stage.className = FRAME.has(name) ? "stage-frame" : "stage-inline";',
        "createRoot(stage).render(createElement(StrictMode, null, createElement(DEMOS[name])));",
      ].join("\n"),
      resolveDir: root,
      loader: "tsx",
    },
    bundle: true,
    platform: "browser",
    format: "iife",
    jsx: "automatic",
    alias: aliases,
    define: { "process.env.NODE_ENV": '"development"' },
    outfile: path.join(out, "preview.js"),
    logLevel: "silent",
  });
  const tw = path.join(pro, "node_modules", "@tailwindcss", "cli", "dist", "index.mjs");
  if (!existsSync(tw)) throw new Error(`batch: the Tailwind CLI is missing at ${tw}; run pnpm install in ../rhs-ui-pro`);
  const css = [
    `@import "${slash(path.join(pro, "node_modules", "tailwindcss", "index.css"))}";`,
    `@import "${slash(path.join(website, "src", "styles", "tokens.css"))}";`,
    `@source "${slash(path.join(root, "registry"))}";`,
    "@custom-variant dark (&:is(.dark *));",
    themeLayer(all),
    "@layer base {",
    "  * { @apply border-border outline-ring/50; }",
    "  body { @apply bg-background text-foreground font-sans antialiased; font-size: .9375rem; line-height: 1.55; }",
    "  h1, h2, h3, h4 { @apply font-heading; text-wrap: balance; letter-spacing: -0.02em; }",
    "}",
    'html { --font-sans: "Instrument Sans", ui-sans-serif, system-ui, "Segoe UI", sans-serif; --font-display: "Bricolage Grotesque", ui-sans-serif, system-ui, sans-serif; --font-mono: "JetBrains Mono", ui-monospace, Consolas, monospace; }',
    ".stage-inline { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 56px 32px; }",
    // About the width of a component preview on rhsui.com.
    ".stage-inline > * { max-width: min(100%, 900px); }",
    ".stage-frame { min-height: 100vh; }",
  ].join("\n");
  writeFileSync(path.join(out, "preview.src.css"), css);
  const run = spawnSync(process.execPath, [tw, "-i", path.join(out, "preview.src.css"), "-o", path.join(out, "preview.css")], { cwd: pro, encoding: "utf8" });
  if (run.status !== 0) throw new Error(`batch: tailwind failed\n${run.stderr}`);
  const fonts = "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..700&family=Instrument+Sans:wght@400..700&family=JetBrains+Mono:wght@400;500&display=swap";
  writeFileSync(
    path.join(out, "preview.html"),
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="${fonts}"><link rel="stylesheet" href="./preview.css"></head><body><div id="root"></div><script src="./preview.js"></script></body></html>`,
  );
  return pathToFileURL(path.join(out, "preview.html")).href;
}

const IGNORED_CONSOLE = [/fonts\.(googleapis|gstatic)\.com/, /Failed to load resource/, /Download the React DevTools/];

async function browsePhase(demos, all, out, { sweep = true } = {}) {
  const url = await buildHarness(demos, all, out);
  const requireWeb = createRequire(path.join(website, "package.json"));
  const { chromium } = requireWeb("playwright");
  const browser = await chromium.launch();
  const results = {};
  try {
    const modes = [
      { key: "light", width: 1280, height: 800, theme: "light", max: MAX_SHOT.desktop },
      { key: "dark", width: 1280, height: 800, theme: "dark", max: MAX_SHOT.desktop },
      { key: "mobile", width: 390, height: 844, theme: "light", max: MAX_SHOT.mobile },
    ];
    const contexts = Object.fromEntries(
      await Promise.all(modes.map(async (m) => [m.key, await browser.newContext({ viewport: { width: m.width, height: m.height }, colorScheme: m.theme, deviceScaleFactor: 1 })])),
    );
    for (const demo of demos) {
      const problems = [];
      const shots = {};
      for (const mode of modes) {
        const page = await contexts[mode.key].newPage();
        page.on("pageerror", (e) => problems.push(`${mode.key}: page error: ${String(e.message).split("\n")[0]}`));
        page.on("console", (m) => {
          if (m.type() === "error" && !IGNORED_CONSOLE.some((re) => re.test(m.text()))) problems.push(`${mode.key}: console error: ${m.text().split("\n")[0].slice(0, 300)}`);
        });
        await page.goto(`${url}?demo=${demo.name}&theme=${mode.theme}`, { waitUntil: "load" });
        await page.evaluate(() => document.fonts?.ready).catch(() => {});
        await page.waitForTimeout(450);
        const box = await page.evaluate(() => {
          const stage = document.getElementById("root");
          const r = stage?.firstElementChild?.getBoundingClientRect();
          return { inline: stage?.className === "stage-inline", children: stage?.childElementCount ?? 0, x: r?.left ?? 0, y: (r?.top ?? 0) + scrollY, w: r?.width ?? 0, h: r?.height ?? 0, scroll: document.documentElement.scrollWidth, inner: window.innerWidth, full: document.documentElement.scrollHeight };
        });
        if (!box.children || box.h < 4) problems.push(`${mode.key}: the demo renders nothing visible`);
        if (mode.key === "mobile" && box.scroll > box.inner + 1) problems.push(`mobile: the page is ${box.scroll}px wide at 390; something overflows`);
        const file = path.join(out, `${demo.name}-${mode.key}.png`);
        // A component is cropped to itself with a margin, so it is seen at full size; a section keeps the whole width.
        // On the phone the whole width stays in the picture, so an overflow shows.
        const clip = box.inline && mode.key !== "mobile"
          ? { x: Math.max(0, Math.floor(box.x - 40)), y: Math.max(0, Math.floor(box.y - 40)), width: Math.min(mode.width, Math.ceil(Math.max(box.w + 80, 420))), height: Math.min(mode.max, Math.ceil(box.h + 80)) }
          : box.inline
            ? { x: 0, y: Math.max(0, Math.floor(box.y - 40)), width: mode.width, height: Math.min(mode.max, Math.ceil(box.h + 80)) }
            : { x: 0, y: 0, width: mode.width, height: Math.min(Math.max(box.full, mode.height), mode.max) };
        if (clip.x + clip.width > mode.width) clip.x = Math.max(0, mode.width - clip.width);
        await page.screenshot({ path: file, clip, fullPage: true });
        shots[mode.key] = file;
        if (sweep && mode.key === "light") {
          const buttons = await page.locator("button:visible:not([disabled])").all();
          for (const button of buttons.slice(0, 40)) {
            await button.click({ timeout: 1500 }).catch(() => {});
            await page.waitForTimeout(80);
            await page.keyboard.press("Escape").catch(() => {});
          }
          await page.waitForTimeout(150);
        }
        await page.close();
      }
      // One sheet to look at: light and dark side by side, the phone next to them.
      // A file:// page, because about:blank may not load file:// images.
      const sheet = await contexts.light.newPage();
      const img = (f, w) => `<figure style="margin:0"><img src="./${path.basename(f)}" style="max-width:${w}px;display:block;border:1px solid #aaa"><figcaption>${path.basename(f, ".png").split("-").pop()}</figcaption></figure>`;
      await sheet.setViewportSize({ width: 1600, height: 900 });
      const sheetHtml = path.join(out, `sheet-${demo.name}.html`);
      writeFileSync(
        sheetHtml,
        `<html><body style="margin:0;padding:14px;background:#d4d4d4;font:12px ui-monospace,monospace;width:max-content"><div style="margin-bottom:8px">${demo.name}</div><div style="display:flex;gap:12px;align-items:flex-start">${img(shots.light, 760)}${img(shots.dark, 760)}${img(shots.mobile, 300)}</div></body></html>`,
      );
      await sheet.goto(pathToFileURL(sheetHtml).href, { waitUntil: "load" });
      const sheetFile = path.join(out, `sheet-${demo.name}.png`);
      await sheet.screenshot({ path: sheetFile, fullPage: true });
      await sheet.close();
      results[demo.name] = { problems: [...new Set(problems)], sheet: sheetFile, shots };
    }
  } finally {
    await browser.close();
  }
  return results;
}

async function check(file) {
  const manifest = readManifest(file);
  const out = path.join(root, ".scratch", "batches", manifest.id);
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  const { problems: registry, all } = registryPhase(manifest);
  const types = typePhase(manifest, out);
  const demos = manifest.items.filter((i) => isExample(i) && existsSync(path.join(root, i.files?.[0]?.path ?? "")));
  let render = [];
  try {
    render = await renderPhase(demos, all, out);
  } catch (error) {
    render = [`the demos do not bundle: ${String(error?.message ?? error).split("\n").slice(0, 6).join(" | ")}`];
  }
  let browser = {};
  if (!flags.has("--no-shots") && !render.some((r) => r.startsWith("the demos do not bundle"))) browser = await browsePhase(demos, all, out);
  const browserProblems = Object.entries(browser).flatMap(([name, r]) => r.problems.map((p) => `${name}: ${p}`));
  const report = { id: manifest.id, items: manifest.items.length, registry, types, render, browser: browserProblems, sheets: Object.values(browser).map((r) => r.sheet) };
  writeFileSync(path.join(out, "report.json"), JSON.stringify(report, null, 2));
  const section = (title, list) => console.log(`${title}: ${list.length ? `${list.length} problem(s)` : "ok"}${list.length ? "\n  " + list.slice(0, 60).join("\n  ") : ""}`);
  console.log(`batch ${manifest.id}: ${manifest.items.filter((i) => !isExample(i)).length} items, ${demos.length} demos`);
  section("registry", registry);
  section("types", types);
  section("server render", render);
  section("browser", browserProblems);
  if (report.sheets.length) console.log(`sheets (LOOK at every one):\n  ${report.sheets.join("\n  ")}`);
  const failed = registry.length + types.length + render.length + browserProblems.length;
  console.log(failed ? `RESULT: FAIL (${failed})` : "RESULT: PASS");
  process.exitCode = failed ? 1 : 0;
}

function merge(files) {
  const existing = loadItems();
  const taken = new Set(existing.map((i) => i.name));
  const byName = new Map(existing.map((i) => [i.name, i]));
  const additions = new Map();
  for (const file of files) {
    const manifest = readManifest(file);
    for (const item of manifest.items) byName.set(item.name, item);
    for (const item of manifest.items) {
      if (taken.has(item.name)) throw new Error(`merge: ${item.name} (${manifest.id}) is already in the registry`);
      taken.add(item.name);
      const fragment = fragmentOf(item, byName);
      if (!fragment || !existsSync(path.join(root, "registry", fragment))) throw new Error(`merge: no fragment for ${item.name}`);
      additions.set(fragment, [...(additions.get(fragment) ?? []), item]);
    }
  }
  for (const [fragment, items] of additions) {
    const target = path.join(root, "registry", fragment, "registry.json");
    const json = JSON.parse(readFileSync(target, "utf8"));
    json.items.push(...items.map(({ __fragment, ...item }) => item));
    writeFileSync(target, JSON.stringify(json, null, 2) + "\n");
    console.log(`merge: ${items.length} entr${items.length === 1 ? "y" : "ies"} into registry/${fragment}/registry.json`);
  }
}

async function shots(names) {
  const all = loadItems();
  const demos = names.map((n) => (n.endsWith("-demo") ? n : `${n}-demo`)).map((n) => all.find((i) => i.name === n) ?? (() => { throw new Error(`shots: no demo ${n}`); })());
  const out = path.join(root, ".scratch", "shots");
  mkdirSync(out, { recursive: true });
  const results = await browsePhase(demos, all, out, { sweep: false });
  for (const [name, r] of Object.entries(results)) console.log(`${r.sheet}${r.problems.length ? `  (${r.problems.join("; ")})` : ""}  ${name}`);
}

if (command === "check" && args[0]) await check(args[0]);
else if (command === "merge" && args.length) merge(args);
else if (command === "shots" && args.length) await shots(args);
else {
  console.error("usage: node scripts/batch.mjs check <manifest.json> [--no-shots] | merge <manifest.json...> | shots <demo...>");
  process.exitCode = 2;
}
