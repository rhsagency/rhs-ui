/**
 * The contract with everything that installs from this registry (a project, rhsui.com, RHS Orbit's builder): what
 * a release had stays, until a version says it may go. Compared against contract/baseline.json, the last release:
 *
 *   - every item name, and the path a project imports it from
 *   - every component and helper an item exports (generated code imports them by name)
 *   - every theme variable, light and dark
 *
 * Adding is always fine. Something gone fails, unless package.json moved to a breaking version against the
 * baseline: the next minor below 1.0 (0.y.z may break on y), the next major from 1.0 on.
 *
 *   node scripts/check-contract.mjs              compare public/r/component-index.json with the baseline
 *   node scripts/check-contract.mjs --baseline   at a release: make the current index the new baseline
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { INDEX_PATH } from "./component-index-file.mjs";

const root = path.resolve(import.meta.dirname, "..");
const BASELINE = path.join(root, "contract", "baseline.json");

/** What a project can rely on in an index: names, import paths, exports, theme variables. */
export function surfaceOf(index) {
  return {
    items: index.items.map((item) => item.name).sort(),
    imports: Object.fromEntries(index.entries.map((entry) => [entry.name, entry.importPath]).sort(([a], [b]) => a.localeCompare(b))),
    exports: Object.fromEntries(
      index.entries.map((entry) => [entry.name, [...entry.components.map((component) => component.name), ...entry.helpers.map((helper) => (typeof helper === "string" ? helper : helper.name))].sort()]).sort(([a], [b]) => a.localeCompare(b)),
    ),
    theme: Object.fromEntries(Object.entries(index.theme).map(([mode, vars]) => [mode, Object.keys(vars).sort()])),
  };
}

const parse = (version) => {
  const match = /^(\d+)\.(\d+)\.(\d+)/.exec(String(version));
  if (!match) throw new Error(`check-contract: "${version}" is not a semver version`);
  return match.slice(1, 4).map(Number);
};

/** Whether `next` may remove what `released` had: a major bump, or below 1.0 a minor bump. */
export function mayBreak(released, next) {
  const [rMajor, rMinor] = parse(released);
  const [nMajor, nMinor] = parse(next);
  if (nMajor !== rMajor) return nMajor > rMajor;
  return rMajor === 0 && nMinor > rMinor;
}

/** Everything the baseline had that the current surface lost, one line each. */
export function lost(baseline, current) {
  const gone = [];
  const items = new Set(current.items);
  for (const name of baseline.items) if (!items.has(name)) gone.push(`item ${name} is gone`);
  for (const [name, importPath] of Object.entries(baseline.imports)) {
    if (!(name in current.imports)) continue;
    if (current.imports[name] !== importPath) gone.push(`${name} moved from ${importPath} to ${current.imports[name]}`);
  }
  for (const [name, names] of Object.entries(baseline.exports)) {
    const now = new Set(current.exports[name] ?? []);
    if (!(name in current.exports)) continue;
    for (const exported of names) if (!now.has(exported)) gone.push(`${name} no longer exports ${exported}`);
  }
  for (const [mode, vars] of Object.entries(baseline.theme)) {
    const now = new Set(current.theme[mode] ?? []);
    for (const variable of vars) if (!now.has(variable)) gone.push(`theme ${mode} lost --${variable}`);
  }
  return gone;
}

function selfTest(baseline) {
  // A planted removal of each kind must be caught, and adding must not be.
  const copy = () => JSON.parse(JSON.stringify(baseline));
  const name = baseline.items[0];
  const withEntry = Object.keys(baseline.exports).find((key) => baseline.exports[key].length > 0);
  const mode = Object.keys(baseline.theme)[0];
  const cases = [
    ["a removed item", (s) => (s.items = s.items.filter((item) => item !== name))],
    ["a moved import", (s) => (s.imports[name] = `${s.imports[name]}-moved`)],
    ["a dropped export", (s) => (s.exports[withEntry] = s.exports[withEntry].slice(1))],
    ["a dropped theme variable", (s) => (s.theme[mode] = s.theme[mode].slice(1))],
  ];
  for (const [label, plant] of cases) {
    const broken = copy();
    plant(broken);
    if (lost(baseline, broken).length === 0) throw new Error(`check-contract self-test: ${label} was not caught`);
  }
  const grown = copy();
  grown.items.push("brand-new-item");
  grown.exports[withEntry].push("BrandNewExport");
  if (lost(baseline, grown).length) throw new Error("check-contract self-test: adding counted as breaking");
  if (!mayBreak("0.2.0", "0.3.0") || mayBreak("0.2.0", "0.2.9") || !mayBreak("1.4.0", "2.0.0") || mayBreak("1.4.0", "1.9.0")) throw new Error("check-contract self-test: the version rule is wrong");
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const indexFile = path.join(root, INDEX_PATH);
  if (!existsSync(indexFile)) {
    console.log(`FAIL check-contract: ${INDEX_PATH} is missing; run pnpm registry:build`);
    process.exit(1);
  }
  const index = JSON.parse(readFileSync(indexFile, "utf8"));
  const current = surfaceOf(index);
  if (process.argv.includes("--baseline")) {
    writeFileSync(BASELINE, `${JSON.stringify({ release: index.source.version, ...current }, null, 2)}\n`);
    console.log(`check-contract: baseline is now ${index.source.version} (${current.items.length} items)`);
    process.exit(0);
  }
  if (!existsSync(BASELINE)) {
    console.log("FAIL check-contract: contract/baseline.json is missing (blind is not green)");
    process.exit(1);
  }
  const baseline = JSON.parse(readFileSync(BASELINE, "utf8"));
  selfTest(baseline);
  const gone = lost(baseline, current);
  if (gone.length && !mayBreak(baseline.release, index.source.version)) {
    for (const line of gone.slice(0, 40)) console.log(`FAIL contract: ${line}`);
    console.log(`${gone.length} thing(s) of release ${baseline.release} are gone without a breaking version (package.json says ${index.source.version}). Bring them back, or bump to a breaking version and say so in CHANGELOG.md.`);
    process.exit(1);
  }
  const added = current.items.length - baseline.items.length;
  console.log(`check-contract: nothing of release ${baseline.release} is gone${gone.length ? ` (${gone.length} removal(s) allowed by ${index.source.version})` : ""}; ${added >= 0 ? `${added} item(s) added` : `${-added} removed`} (self-test passed)`);
}
