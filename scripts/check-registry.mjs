/**
 * Registry gate. Every item must be complete and consistent, and nothing
 * foreign may enter the registry:
 *
 *  - title, description, categories[0] from the taxonomy, meta.tier/version/since/status
 *  - every file exists, and every non-example file has a target under an rhs-ui/ folder
 *  - every @/registry/rhs-ui/... import in a file resolves to a file of the same item
 *    or to an item listed in registryDependencies as https://rhsui.com/r/<name>.json
 *  - registryDependencies never use a bare name (that would mean a shadcn built-in)
 *    or a namespaced name (fails without namespace setup)
 *  - dependencies never include lucide-react, cn, shadcn, @base-ui/*, @radix-ui/* (use the unified radix-ui)
 *  - names are unique across fragments
 *
 * A negative control at the end proves the gate can fail. Run: pnpm check:registry
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const TAXONOMY = new Set(["core", "application", "commerce", "dashboard", "marketing", "templates"]);
const FORBIDDEN = [/^lucide-react(@|$)/, /^cn(@|$)/, /^shadcn(@|$)/, /^@base-ui\//, /^@radix-ui\//, /^tw-animate-css(@|$)/];
const URL_DEP = /^https:\/\/rhsui\.com\/r\/([a-z0-9-]+)\.json$/;

/** The source of truth is the set of fragments, not the generated root. */
function loadItems() {
  const items = [];
  for (const file of readdirSync(path.join(root, "registry")).filter((f) => f.endsWith(".json")).sort()) {
    const fragment = JSON.parse(readFileSync(path.join(root, "registry", file), "utf8"));
    items.push(...(fragment.items ?? []));
  }
  return items;
}

export function checkItems(items) {
  const problems = [];
  const names = new Set();
  const byName = new Map(items.map((i) => [i.name, i]));
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
    if (!isExample) {
      if (!item.categories?.length || !TAXONOMY.has(item.categories[0])) p("categories[0] must be from the taxonomy");
      for (const k of ["tier", "version", "since", "status"]) if (!item.meta?.[k]) p(`missing meta.${k}`);
    }
    if (item.type !== "registry:theme" && !item.files?.length) p("no files");
    for (const f of item.files ?? []) {
      if (!existsSync(path.join(root, f.path))) p(`file does not exist: ${f.path}`);
      if (!isExample && !(f.target && /(^|\/)rhs-ui\//.test(f.target))) p(`file needs a target under an rhs-ui/ folder: ${f.path}`);
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
      for (const m of src.matchAll(/from\s+["']@\/registry\/rhs-ui\/([^"']+)["']/g)) {
        const target = `registry/rhs-ui/${m[1]}`;
        if (own.has(target)) continue;
        const dep = [...byName.values()].find((i) => (i.files ?? []).some((ff) => ff.path.replace(/\.tsx?$/, "") === target));
        if (!dep) p(`import of ${m[1]} does not belong to any item`);
        else if (!declared.has(dep.name)) p(`imports ${dep.name} but does not declare https://rhsui.com/r/${dep.name}.json`);
      }
      for (const m of src.matchAll(/from\s+["']([^"'.@][^"']*|@[^/"']+\/[^"']+)["']/g)) {
        const spec = m[1];
        if (spec.startsWith("@/")) continue;
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

const problems = checkItems(loadItems());
for (const pr of problems) console.log(`FAIL ${pr}`);

// Negative control.
const planted = checkItems([
  { name: "planted", type: "registry:ui", title: "x", description: "a planted item that must fail the gate", categories: ["nope"], meta: {}, files: [{ path: "registry/rhs-ui/ui/rhs-ui/nope.tsx", type: "registry:ui" }], registryDependencies: ["button", "@rhs-ui/badge"], dependencies: ["lucide-react@^1.0.0", "radix-ui"] },
]);
if (planted.length < 6) {
  console.log(`FAIL self-test: planted item produced only ${planted.length} problem(s)`);
  process.exit(1);
}

if (problems.length) {
  console.log(`${problems.length} problem(s)`);
  process.exit(1);
}
console.log(`check-registry: ${loadItems().length} items clean (self-test passed)`);
