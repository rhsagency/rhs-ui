/**
 * The real proof: install every built item into scratch Next projects with the
 * shadcn CLI and typecheck them. Two projects, one initialised with Base UI
 * (the shadcn default) and one with Radix, so RHS UI is proven to sit next to
 * either flavour of an existing shadcn setup without touching it.
 *
 * Needs the network (create-next-app, shadcn init). Run: pnpm test:install
 * Add --flavor base|radix to run one.
 */
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const scratch = path.join(root, ".scratch");
const flavors = process.argv.includes("--flavor") ? [process.argv[process.argv.indexOf("--flavor") + 1]] : ["base", "radix"];

const items = readdirSync(path.join(root, "public", "r"))
  .filter((f) => f.endsWith(".json") && f !== "registry.json")
  .map((f) => f.slice(0, -5));
if (!items.length) {
  console.error("test-install: no built items. Run pnpm registry:build first.");
  process.exit(1);
}

const run = (cmd, cwd) => execSync(cmd, { cwd, stdio: "inherit", shell: true });

let failed = 0;
for (const flavor of flavors) {
  const dir = path.join(scratch, `app-${flavor}`);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(scratch, { recursive: true });
  console.log(`\n=== ${flavor}: scaffolding ===`);
  run(`pnpm create next-app@16.3.5 app-${flavor} --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --turbopack --use-pnpm --yes`, scratch);
  run(`pnpm dlx shadcn@latest init -y -b ${flavor} -p nova`, dir);
  // Local JSON files resolve their registryDependencies by URL; point those at
  // the local build by copying every item next to the project as a mini
  // registry served from disk is not possible, so install in dependency order
  // from the local files directly.
  const ordered = ["icons", "button", "badge", "skeleton", "separator", "kbd", "input", "label", "tooltip", "dialog", "sheet", "tabs", "command", "rhs-ui-theme"];
  const rest = items.filter((i) => !ordered.includes(i) && !i.endsWith("-demo"));
  for (const item of [...ordered.filter((i) => items.includes(i)), ...rest]) {
    const file = path.join(root, "public", "r", `${item}.json`);
    if (!existsSync(file)) continue;
    console.log(`--- ${flavor}: add ${item}`);
    try {
      run(`pnpm dlx shadcn@latest add -y -o "${file}"`, dir);
    } catch {
      failed++;
      console.log(`FAIL ${flavor}: add ${item}`);
    }
  }
  console.log(`=== ${flavor}: typecheck ===`);
  try {
    run("pnpm exec tsc --noEmit", dir);
  } catch {
    failed++;
    console.log(`FAIL ${flavor}: typecheck`);
  }
}

if (failed) {
  console.log(`test-install: ${failed} failure(s)`);
  process.exit(1);
}
console.log("test-install: every item installs and typechecks in both flavours");
