/**
 * The built registry must be committed exactly as the build writes it. `git
 * diff` misses files the build created but nobody added (92 animated icons
 * once shipped without their public/r JSON that way), so this reads `git
 * status`, which lists untracked files too.
 *
 * Run: pnpm check:built
 */
import { execFileSync } from "node:child_process";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const BUILT = ["public/r", "registry.json", "README.md"];

/** Lines of `git status --porcelain` that mean the build output is not committed as built. */
export function uncommitted(porcelain) {
  return porcelain.split("\n").filter((line) => line.trim() !== "");
}

execFileSync(process.execPath, [path.join(root, "scripts/build-registry.mjs")], { cwd: root, stdio: "ignore" });
const status = execFileSync("git", ["status", "--porcelain", "--untracked-files=all", "--", ...BUILT], { cwd: root, encoding: "utf8" });
const problems = uncommitted(status);

// Negative controls: an untracked and a modified build file both count; a clean tree does not.
if (uncommitted("?? public/r/animated-new.json\n").length !== 1 || uncommitted(" M registry.json\n").length !== 1 || uncommitted("").length !== 0) {
  console.log("FAIL self-test: check-built would miss uncommitted build output");
  process.exit(1);
}

for (const line of problems) console.log(`FAIL not committed as built: ${line}`);
if (problems.length) {
  console.log(`${problems.length} build file(s) differ from what is committed; run pnpm registry:build and commit public/r, registry.json and README.md (git add new files first).`);
  process.exit(1);
}
console.log("check-built: the committed registry matches the build, untracked files included (self-test passed)");
