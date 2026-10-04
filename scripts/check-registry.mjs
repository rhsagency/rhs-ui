/**
 * Registry gate. Every item must be complete and consistent, sit where its
 * category says, and nothing foreign may enter the registry:
 *
 *  - title, description, categories[0] from the taxonomy, meta.tier/version/since/status
 *  - the structure: an item's files live in registry/<categories[0]>/ and install to
 *    components/rhs-ui/<the same path>, so folder, import path and category always agree;
 *    demos live in registry/examples/
 *  - every @rhs-ui/... import resolves to a file of the same item or to an item
 *    listed in registryDependencies as https://rhsui.com/r/<name>.json, and
 *    tsconfig.json has the one alias, @rhs-ui/* -> ./registry/*
 *  - a file that calls a React hook starts with "use client"
 *  - registryDependencies never use a bare name (that would mean a shadcn built-in)
 *    or a namespaced name (fails without namespace setup)
 *  - dependencies never include lucide-react, cn, shadcn, @base-ui/*, @radix-ui/* (use the unified radix-ui)
 *  - names are unique across fragments
 *
 * Negative controls at the end prove the gate can fail. Run: pnpm check:registry
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { FAMILIES, familyOf } from "./families.mjs";

const root = path.resolve(import.meta.dirname, "..");
/** The categories, and with them the folders under registry/ and components/rhs-ui/. */
const TAXONOMY = new Set(["primitives", "icons", "application", "commerce", "dashboard", "marketing", "templates", "models", "backgrounds", "motion"]);
const FORBIDDEN = [/^lucide-react(@|$)/, /^cn(@|$)/, /^shadcn(@|$)/, /^@base-ui\//, /^@radix-ui\//, /^tw-animate-css(@|$)/];
const MOTION_KINDS = new Set(["trigger", "state"]);
const URL_DEP = /^https:\/\/rhsui\.com\/r\/([a-z0-9-]+)\.json$/;
const ALIAS_IMPORT = /from\s+["']@rhs-ui\/([^"']+)["']/g;
// A hook call, also with type arguments: useMemo<Option[]>(...), useState<Set<string>>(...).
const HOOK_CALL = /\buse(?!Id\b)[A-Z]\w*\s*(?:<[^()]*?>)?\s*\(/;

/**
 * The source of truth is the registry.json in every category folder, not the
 * generated root. A stray registry/<name>.json would shadow the folder of the
 * same name in module resolution (@rhs-ui/icons -> registry/icons.json).
 */
function loadItems() {
  const items = [];
  for (const entry of readdirSync(path.join(root, "registry"), { withFileTypes: true })) {
    if (entry.isFile()) {
      strays.push(`registry/${entry.name}: only category folders belong in registry/`);
      continue;
    }
    const file = path.join(root, "registry", entry.name, "registry.json");
    if (!existsSync(file)) continue;
    const fragment = JSON.parse(readFileSync(file, "utf8"));
    items.push(...(fragment.items ?? []).map((item) => ({ ...item, __fragment: entry.name })));
  }
  return items;
}
const strays = [];

/** A file that calls a hook must be a client module, or a Server Component that imports it fails at runtime. */
export function clientProblems(src) {
  const hook = HOOK_CALL.exec(src);
  return hook && !/^\s*["']use client["']/.test(src) ? [`calls ${hook[0].replace(/\s*\($/, "")}() without "use client"`] : [];
}

/**
 * A "use client" module turns every export into a client reference for a
 * Server Component: a helper like initialsOf() cannot be called there, and a
 * class string arrives as a reference instead of the string. A module that
 * calls no hook needs no directive (Radix marks its own files), so helpers
 * and constants live in modules without one.
 */
export function clientExportProblems(src) {
  if (!/^\s*["']use client["']/.test(src) || HOOK_CALL.test(src)) return [];
  const values = [...src.matchAll(/export\s+(?:const|function|let)\s+([a-z]\w*)/g)].map((match) => match[1]);
  return values.length ? [`is "use client" but calls no hook and exports ${values.join(", ")}; a Server Component would get a client reference. Drop the directive.`] : [];
}

/**
 * An Intl formatter without a locale uses the server's default while
 * rendering and the reader's in the browser: a Dutch reader then hydrates
 * "1.234" over "1,234" and React throws the server HTML away.
 */
export function unlocalisedIntlProblems(src) {
  return /\bIntl\.(DateTimeFormat|NumberFormat|RelativeTimeFormat|ListFormat|PluralRules)\(\s*(undefined\b|\)|\{)/.test(src) || /\.toLocale(Date|Time)?String\(\s*\)/.test(src)
    ? ["formats with Intl or toLocaleString without a locale; server and browser disagree. Pass a locale (a prop with a fixed default)."]
    : [];
}

/**
 * A component as a prop (linkAs, an icon component) cannot cross from a
 * Server Component into a "use client" module: React refuses to serialise a
 * function. Such a component must itself be a server-compatible module that
 * renders its client parts inside.
 */
export function componentPropProblems(src) {
  return /^\s*["']use client["']/.test(src) && /:\s*(ElementType|ComponentType)\b/.test(src)
    ? ['is "use client" but takes a component as a prop (ElementType or ComponentType); a Server Component cannot pass one. Drop the directive and keep the client parts inside.']
    : [];
}

/**
 * A link target is not an identity: two links to the same place (a demo full
 * of "#", a footer with Privacy in two columns) give React duplicate keys,
 * and it drops or doubles one of them. Key lists of links on label and href.
 */
export function hrefKeyProblems(src) {
  return /key=\{\w+\.href\}/.test(src) ? ["keys a list on .href alone; two links to the same place collide. Use the label as well."] : [];
}

/**
 * Text clipped to its background (bg-clip-text with text-transparent) makes
 * currentColor transparent too, so a gradient built from currentColor paints
 * nothing and the text disappears. Use theme tokens in that gradient.
 */
export function clippedCurrentColorProblems(src) {
  return /text-transparent/.test(src) && /bg-\[[^\]]*currentColor/.test(src) ? ["paints a background with currentColor on transparent text; currentColor is transparent there. Use theme tokens."] : [];
}

/**
 * A scroll container that is not positioned does not clip absolutely
 * positioned descendants: the sr-only labels in a wide pricing table then
 * stick out past it and widen the whole page on a phone. Every
 * overflow-auto / -x-auto / -y-auto class list also positions the element.
 */
export function unpositionedScrollProblems(src) {
  const lists = [...src.matchAll(/["'`]([^"'`]*\boverflow-(?:x-|y-)?auto\b[^"'`]*)["'`]/g)].map((match) => match[1]);
  return lists.some((list) => !/(^|\s)(relative|absolute|fixed|sticky)(\s|$)/.test(list))
    ? ["has a scroll container (overflow-auto) without relative; absolutely positioned children such as sr-only text escape it and widen the page"]
    : [];
}

/** Tailwind reads classes from the source text: `${variant}:w-max` never appears whole, so it is never generated. */
export function composedVariantProblems(src) {
  return /\$\{[^}]+\}:[a-z[!-]/.test(src) ? ["builds a Tailwind variant in a template string (`${…}:class`); Tailwind never generates it, write the class out"] : [];
}

const GROUP_USE =/(?<![\w-])(group|peer)-(?:\[[^\]]*\]|[\w-])+\/([a-z][\w-]*)(?=:)/g;
const GROUP_DECLARE = /(?<![\w-])(group|peer)\/([a-z][\w-]*)(?![\w-]*:)/g;

/**
 * A named variant like group-data-[state=open]/list: only matches inside an
 * element that carries group/list. Without the declaration the styles never
 * apply and nothing fails, which is how both Tabs looks shipped unstyled.
 * Names may cross files (the state icons read group/rhs-icon from their
 * wrapper), so the declaration can live anywhere in the registry.
 */
export function groupNameProblems(sources) {
  const declared = new Set();
  for (const src of sources.values()) for (const m of src.matchAll(GROUP_DECLARE)) declared.add(`${m[1]}/${m[2]}`);
  const problems = [];
  for (const [file, src] of sources) {
    const missing = new Set([...src.matchAll(GROUP_USE)].map((m) => `${m[1]}/${m[2]}`).filter((name) => !declared.has(name)));
    for (const name of missing) problems.push(`${file}: uses ${name.replace("/", "-*/")} but no element declares ${name}, so those styles never apply`);
  }
  return problems;
}

export function checkItems(items) {
  const problems = [];
  const names = new Set();
  const byName = new Map(items.map((i) => [i.name, i]));
  const byFile = new Map(
    items.filter((i) => i.type !== "registry:example").flatMap((i) => (i.files ?? []).map((f) => [f.path.replace(/\.tsx?$/, ""), i])),
  );
  // How many items ship each file: more than one means a travelling helper (money.ts), which every importer ships itself.
  const shippedBy = new Map();
  for (const i of items) if (i.type !== "registry:example") for (const f of i.files ?? []) shippedBy.set(f.path.replace(/\.tsx?$/, ""), (shippedBy.get(f.path.replace(/\.tsx?$/, "")) ?? 0) + 1);
  for (const item of items) {
    const p = (msg) => problems.push(`${item.name ?? "(unnamed)"}: ${msg}`);
    if (!item.name) p("missing name");
    // The product is `rhs-ui`, with the hyphen, everywhere in the registry.
    if (/rhsui/.test(JSON.stringify(item).replace(/https:\/\/rhsui\.com/g, ""))) p('contains "rhsui" (the registry name is rhs-ui)');
    if (names.has(item.name)) p("duplicate name");
    names.add(item.name);
    if (!item.title) p("missing title");
    if (!item.description || item.description.length < 20) p("missing or thin description");
    const isExample = item.type === "registry:example";
    const category = item.categories?.[0];
    if (!isExample) {
      if (!category || !TAXONOMY.has(category)) p("categories[0] must be from the taxonomy");
      if (item.__fragment && item.__fragment !== category) p(`entry belongs in registry/${category}/registry.json, not registry/${item.__fragment}/registry.json`);
      if (item.type !== "registry:internal" && !familyOf(item)) p(`categories[1] must name a family (${[...FAMILIES].join(", ")})`);
      for (const k of ["tier", "version", "since", "status"]) if (!item.meta?.[k]) p(`missing meta.${k}`);
      // This is the free, open-source registry. Pro lives in rhs-ui-pro under its
      // own namespace, so a "pro" item here would be published under MIT by accident.
      if (item.meta?.tier && item.meta.tier !== "free") p(`meta.tier must be "free" in the public registry, got "${item.meta.tier}"`);
      // Free animated icons answer one control: motion on a trigger, or two states.
      // Moment icons (stages, status, progress) are a Pro tier (ADR 0016).
      if (item.meta?.motion && !MOTION_KINDS.has(item.meta.motion)) p(`meta.motion must be ${[...MOTION_KINDS].join(" or ")}, got "${item.meta.motion}"`);
      // rhsui.com builds its animated icon pages from meta alone: the still glyph
      // it animates (for grouping) and a usage snippet that names the real export.
      if (item.meta?.motion) {
        for (const problem of animatedMetaProblems(item)) p(problem);
      }
    }
    if (item.type !== "registry:theme" && !item.files?.length) p("no files");
    for (const f of item.files ?? []) {
      if (!existsSync(path.join(root, f.path))) p(`file does not exist: ${f.path}`);
      if (isExample) {
        if (!f.path.startsWith("registry/examples/")) p(`a demo belongs in registry/examples/: ${f.path}`);
        continue;
      }
      if (!f.path.startsWith(`registry/${category}/`)) p(`${f.path} belongs in registry/${category}/, the folder of its category`);
      const target = `components/rhs-ui/${f.path.slice("registry/".length)}`;
      if (f.target !== target) p(`${f.path} must install to ${target}, not ${f.target ?? "(no target)"}`);
    }
    for (const d of item.registryDependencies ?? []) {
      const m = URL_DEP.exec(d);
      if (!m) p(`registryDependencies must be https://rhsui.com/r/<name>.json, got "${d}"`);
      else if (!byName.has(m[1])) p(`registryDependencies points at unknown item "${m[1]}"`);
    }
    for (const d of item.dependencies ?? []) {
      if (FORBIDDEN.some((re) => re.test(d))) p(`forbidden dependency "${d}"`);
      if (!/@\^?\d/.test(d)) p(`dependency without a version: "${d}"`);
    }
    // Imports inside files must resolve to this item or a declared dependency.
    const own = new Set((item.files ?? []).map((f) => f.path.replace(/\.tsx?$/, "")));
    const declared = new Set((item.registryDependencies ?? []).map((d) => URL_DEP.exec(d)?.[1]).filter(Boolean));
    for (const f of item.files ?? []) {
      if (!existsSync(path.join(root, f.path))) continue;
      const src = readFileSync(path.join(root, f.path), "utf8");
      if (src.includes("@/registry/")) p(`${f.path}: legacy registry import; use @rhs-ui/<category>/<item>`);
      for (const problem of clientProblems(src)) p(`${f.path} ${problem}`);
      for (const problem of clientExportProblems(src)) p(`${f.path} ${problem}`);
      for (const problem of composedVariantProblems(src)) p(`${f.path} ${problem}`);
      for (const problem of hrefKeyProblems(src)) p(`${f.path} ${problem}`);
      for (const problem of clippedCurrentColorProblems(src)) p(`${f.path} ${problem}`);
      for (const problem of unpositionedScrollProblems(src)) p(`${f.path} ${problem}`);
      for (const problem of unlocalisedIntlProblems(src)) p(`${f.path} ${problem}`);
      if (!isExample) for (const problem of componentPropProblems(src)) p(`${f.path} ${problem}`);
      for (const m of src.matchAll(ALIAS_IMPORT)) {
        const file = [`registry/${m[1]}`, `registry/${m[1]}/index`].find((candidate) => own.has(candidate) || byFile.has(candidate));
        if (!file) p(`${f.path}: import of @rhs-ui/${m[1]} does not resolve to a registry file`);
        // A shared helper (money.ts) travels in the files of every item that imports it. Depending on
        // whichever item happens to ship it first installs that whole component for one helper.
        else if (!own.has(file) && (shippedBy.get(file) ?? 0) > 1) {
          p(`imports ${file}, a shared file of ${byFile.get(file).name}; list it in this item's own files instead of depending on ${byFile.get(file).name}`);
        } else if (!own.has(file) && !declared.has(byFile.get(file).name)) {
          const dep = byFile.get(file).name;
          p(`imports ${dep} but does not declare https://rhsui.com/r/${dep}.json`);
        }
      }
      for (const m of src.matchAll(/from\s+["']([^"'.@][^"']*|@[^/"']+\/[^"']+)["']/g)) {
        const spec = m[1];
        if (spec.startsWith("@/") || spec.startsWith("@rhs-ui/")) continue;
        const pkg = spec.startsWith("@") ? spec.split("/").slice(0, 2).join("/") : spec.split("/")[0];
        if (["react", "react-dom"].includes(pkg)) continue;
        if (!(item.dependencies ?? []).some((d) => d === pkg || d.startsWith(`${pkg}@`))) {
          // allowed through a registry dependency that declares it? no: each item declares what it imports
          p(`imports "${pkg}" but does not declare it in dependencies`);
        }
      }
    }
  }
  return problems;
}

const GLYPH_EXPORTS = new Set(
  [...readFileSync(path.join(root, "registry/icons/index.tsx"), "utf8").matchAll(/export (?:const|function) (Icon\w+)/g)].map((m) => m[1]),
);

/** An animated icon names glyphs that exist and a usage snippet that uses its own export. */
export function animatedMetaProblems(item, glyphExports = GLYPH_EXPORTS, source = null) {
  const problems = [];
  const glyphs = [item.meta?.glyph ?? []].flat();
  if (!glyphs.length) problems.push("meta.glyph must name the still glyph it animates");
  for (const glyph of glyphs) if (!glyphExports.has(glyph)) problems.push(`meta.glyph "${glyph}" is not an export of registry/icons/index.tsx`);
  const file = item.files?.[0]?.path;
  const src = source ?? (file && existsSync(path.join(root, file)) ? readFileSync(path.join(root, file), "utf8") : "");
  const exported = /export function (Icon\w+Animated)\b/.exec(src)?.[1];
  if (!exported) problems.push("must export an Icon...Animated component");
  else if (!item.meta?.usage?.includes(`<${exported}`)) problems.push(`meta.usage must show <${exported}>`);
  return problems;
}

/** One alias, @rhs-ui/* -> ./registry/*, or typecheck and this gate look at different trees. */
function aliasProblems() {
  const paths = JSON.parse(readFileSync(path.join(root, "tsconfig.json"), "utf8")).compilerOptions?.paths ?? {};
  const problems = [];
  if (paths["@rhs-ui/*"]?.[0] !== "./registry/*") problems.push("tsconfig: @rhs-ui/* must resolve to ./registry/*");
  for (const key of Object.keys(paths).filter((k) => k.startsWith("@rhs-ui/") && k !== "@rhs-ui/*")) problems.push(`tsconfig: stale alias ${key}`);
  return problems;
}

const items = loadItems();
const registrySources = new Map(
  [...new Set(items.flatMap((i) => (i.files ?? []).map((f) => f.path)))].filter((p) => existsSync(path.join(root, p))).map((p) => [p, readFileSync(path.join(root, p), "utf8")]),
);
const problems = [...strays, ...aliasProblems(), ...checkItems(items), ...groupNameProblems(registrySources)];
for (const pr of problems) console.log(`FAIL ${pr}`);

// Negative controls: every planted mistake must be caught, or the gate proves nothing.
const button = items.find((i) => i.name === "button");
const withButton = (planted) => [...items.filter((i) => i !== button), planted];
const selfTests = [
  [
    "planted item",
    checkItems([
      { name: "planted", type: "registry:ui", title: "x", description: "a planted item that must fail the gate", categories: ["nope"], meta: {}, files: [{ path: "registry/primitives/nope.tsx", type: "registry:ui" }], registryDependencies: ["button", "@rhs-ui/badge"], dependencies: ["lucide-react@^1.0.0", "radix-ui"] },
    ]).length >= 6,
  ],
  ["undeclared @rhs-ui/icons import", checkItems(withButton({ ...button, registryDependencies: [] })).some((pr) => /^button: imports icons but does not declare/.test(pr))],
  ["item outside the folder of its category", checkItems(withButton({ ...button, categories: ["commerce"] })).some((pr) => /belongs in registry\/commerce\//.test(pr))],
  ["target that does not mirror the source", checkItems(withButton({ ...button, files: [{ ...button.files[0], target: "components/ui/rhs-ui/button.tsx" }] })).some((pr) => /must install to components\/rhs-ui\/primitives\/button\.tsx/.test(pr))],
  ["a pro item in the public registry", checkItems(withButton({ ...button, meta: { ...button.meta, tier: "pro" } })).some((pr) => /meta\.tier must be "free"/.test(pr))],
  ["an animated icon with a pro motion kind", checkItems(withButton({ ...button, meta: { ...button.meta, motion: "moment" } })).some((pr) => /meta\.motion must be/.test(pr))],
  ["a primitive without a family", checkItems(withButton({ ...button, categories: ["primitives"] })).some((pr) => /^button: categories\[1\] must name a family/.test(pr))],
  ["a primitive with an unknown family", checkItems(withButton({ ...button, categories: ["primitives", "widgets"] })).some((pr) => /^button: categories\[1\] must name a family/.test(pr))],
  ["a commerce item falls back to its category", familyOf({ categories: ["commerce", "product", "card"] }) === "commerce"],
  ["hook without use client", clientProblems('import { useState } from "react";\nexport function X() { useState(0); }').length === 1],
  ["hook inside a client module", clientProblems('"use client";\nexport function X() { useState(0); }').length === 0],
  ["a helper exported from a hook-free client module", clientExportProblems('"use client";\nexport function initialsOf(name) { return name; }').length === 1],
  ["a client API next to its hook", clientExportProblems('"use client";\nexport function toast() {}\nexport function Toaster() { useSyncExternalStore(); }').length === 0],
  ["a hook called with type arguments counts as a hook", clientExportProblems('"use client";\nexport function zoneOffset() {}\nexport function X() { const o = useMemo<Option[]>(() => [], []); const s = useState<Set<string>>(new Set()); }').length === 0],
  ["a component-only client module", clientExportProblems('"use client";\nexport function Button() {}').length === 0],
  ["a named group variant nobody declares", groupNameProblems(new Map([["a.tsx", 'cn("inline-flex", "group-data-[variant=line]/list:border-b-2")']])).length === 1],
  ["a named group declared in the same file", groupNameProblems(new Map([["a.tsx", 'cn("group/list inline-flex", "group-data-[variant=line]/list:border-b-2 group-hover/list:text-foreground")']])).length === 0],
  ["a named group declared in another file", groupNameProblems(new Map([["a.tsx", '"group/rhs-icon"'], ["b.tsx", '"group-data-[active=true]/rhs-icon:opacity-0"']])).length === 0],
  ["a client module that takes a component prop", componentPropProblems('"use client";\nexport interface P { linkAs?: ElementType }').length === 1],
  ["a server module that takes a component prop", componentPropProblems('export interface P { linkAs?: ElementType }').length === 0],
  ["an Intl formatter without a locale", unlocalisedIntlProblems("new Intl.NumberFormat(undefined, { style: 'percent' })").length === 1 && unlocalisedIntlProblems("value.toLocaleString()").length === 1],
  ["an Intl formatter with a locale", unlocalisedIntlProblems("new Intl.NumberFormat(locale, format)").length === 0],
  ["a scroll container that is not positioned", unpositionedScrollProblems('<div className="overflow-x-auto rounded-2xl">').length === 1 && unpositionedScrollProblems('<div className="relative overflow-x-auto">').length === 0],
  ["currentColor under clipped text", clippedCurrentColorProblems('"bg-[linear-gradient(currentColor,transparent)] bg-clip-text text-transparent"').length === 1 && clippedCurrentColorProblems('"bg-[linear-gradient(var(--foreground),transparent)] text-transparent"').length === 0],
  [
    "a shared helper taken from another item instead of shipped",
    (() => {
      const tag = items.find((i) => i.name === "price-tag");
      const host = items.find((i) => i.name === "shipping-progress");
      const other = items.find((i) => i.name === "cart-line");
      if (!tag || !host || !other) return false;
      const borrowed = { ...tag, files: tag.files.slice(0, 1), registryDependencies: ["https://rhsui.com/r/shipping-progress.json"] };
      return checkItems([borrowed, host, other]).some((pr) => /^price-tag: imports registry\/commerce\/money, a shared file/.test(pr)) && !checkItems([tag, host, other]).some((pr) => /^price-tag: .*a shared file/.test(pr));
    })(),
  ],
  ["a list keyed on href alone", hrefKeyProblems("<li key={link.href}>").length === 1 && hrefKeyProblems("<li key={`${link.label}-${link.href}`}>").length === 0],
  ["a variant composed in a template string", composedVariantProblems("const c = `${v}:w-max`;").length === 1],
  ["a port in a template string is fine", composedVariantProblems("const u = `http://${host}:3000`;").length === 0],
  ["a named peer variant nobody declares", groupNameProblems(new Map([["a.tsx", '"peer-checked/box:opacity-100"']])).length === 1],
  ["an animated icon without a glyph or with a stale usage", animatedMetaProblems({ meta: { motion: "trigger", usage: "<IconOldAnimated />" }, files: [] }, new Set(["IconBell"]), "export function IconBellAnimated() {}").length === 2],
  ["an animated icon naming a glyph that does not exist", animatedMetaProblems({ meta: { motion: "trigger", glyph: "IconNope", usage: "<IconBellAnimated />" }, files: [] }, new Set(["IconBell"]), "export function IconBellAnimated() {}").length === 1],
  ["a complete animated icon", animatedMetaProblems({ meta: { motion: "state", glyph: ["IconLock", "IconUnlock"], usage: "<IconLockAnimated active />" }, files: [] }, new Set(["IconLock", "IconUnlock"]), "export function IconLockAnimated() {}").length === 0],
];
for (const [name, ok] of selfTests) {
  if (!ok) {
    console.log(`FAIL self-test: ${name}`);
    process.exit(1);
  }
}

if (problems.length) {
  console.log(`${problems.length} problem(s)`);
  process.exit(1);
}
console.log(`check-registry: ${items.length} items clean (${selfTests.length} self-tests passed)`);
