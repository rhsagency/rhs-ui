/**
 * The component index refuses an item a tool could not use: no source file, a dependency that is not a Free item.
 * Planted in a throwaway registry; a good item still passes. (This test came along with the generator from RHS
 * Orbit's worker on 2026-11-04.)
 *
 * Run: pnpm test:index
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { buildIndex } from "./component-index.mjs";

const root = mkdtempSync(path.join(os.tmpdir(), "rhs-ui-index-"));
const failures = [];
try {
  mkdirSync(path.join(root, "registry", "marketing"), { recursive: true });
  writeFileSync(path.join(root, "registry", "marketing", "good.tsx"), "/** Good. */\nexport function Good(props: { a: string }) { return null; }\n");
  const items = [
    { name: "good", description: "Good", files: [{ path: "registry/marketing/good.tsx", target: "components/rhs-ui/marketing/good.tsx" }] },
    { name: "ghost", description: "No source", files: [{ path: "registry/marketing/ghost.tsx", target: "components/rhs-ui/marketing/ghost.tsx" }] },
    { name: "pro-leak", description: "Pro dep", files: [{ path: "registry/marketing/good.tsx", target: "components/rhs-ui/marketing/good.tsx" }], registryDependencies: ["https://rhsui.com/api/pro/r/secret.json"] },
  ];
  const expectThrow = (names, pattern, label) => {
    try {
      buildIndex({ registryRoot: root, registryItems: items, names });
      failures.push(`${label}: built without an error`);
    } catch (error) {
      if (!pattern.test(String(error instanceof Error ? error.message : error))) failures.push(`${label}: wrong error ${error}`);
    }
  };
  const good = buildIndex({ registryRoot: root, registryItems: items, names: ["good"] });
  if (good.length !== 1 || good[0].importPath !== "@rhs-ui/marketing/good" || good[0].components[0]?.name !== "Good") failures.push("a good item did not index as @rhs-ui/marketing/good with its component");
  expectThrow(["good", "ghost"], /ghost: source/, "an item without its source");
  expectThrow(["pro-leak"], /not a Free item/, "an item depending on a Pro item");
} finally {
  rmSync(root, { recursive: true, force: true });
}

for (const failure of failures) console.log(`FAIL ${failure}`);
if (failures.length) process.exit(1);
console.log("test-component-index: a good item indexes; a missing source and a Pro dependency are refused");
