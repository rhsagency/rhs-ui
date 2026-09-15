/**
 * The real proof: serve the built registry from a local HTTP server exactly
 * as rhsui.com will, then install every item into fresh Next projects with
 * the shadcn CLI and typecheck them. Two projects, one initialised with
 * Base UI (the shadcn default) and one with Radix, so RHS UI is proven to
 * sit next to either flavour of an existing shadcn setup without touching it.
 *
 * The built JSON references dependencies as https://rhsui.com/r/<name>.json.
 * For the test those URLs are rewritten to the local server, so the resolver
 * follows the same tree it will follow in production.
 *
 * Needs the network for create-next-app and shadcn init. Run: pnpm test:install
 * Add --flavor base|radix to run one flavour.
 */
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import http from "node:http";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const scratch = path.join(root, ".scratch");
const built = path.join(root, "public", "r");
const flavors = process.argv.includes("--flavor") ? [process.argv[process.argv.indexOf("--flavor") + 1]] : ["base", "radix"];

const files = readdirSync(built).filter((f) => f.endsWith(".json"));
if (!files.length) {
  console.error("test-install: no built items. Run pnpm registry:build first.");
  process.exit(1);
}

// A local mirror of public/r with the production URLs pointed at this server.
let port = 0;
const server = http.createServer((req, res) => {
  const name = (req.url ?? "").replace(/^\/r\//, "").replace(/\?.*$/, "");
  const file = path.join(built, name);
  if (!name.endsWith(".json") || !existsSync(file)) {
    res.writeHead(404);
    res.end();
    return;
  }
  const body = readFileSync(file, "utf8").replaceAll("https://rhsui.com/r/", `http://127.0.0.1:${port}/r/`);
  res.writeHead(200, { "content-type": "application/json" });
  res.end(body);
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
port = server.address().port;
console.log(`test-install: serving ${files.length} file(s) at http://127.0.0.1:${port}/r/`);

// Async on purpose: the registry server lives in this process, and a
// blocking execSync would freeze the event loop while the CLI waits for it.
const run = (cmd, cwd) =>
  new Promise((resolve, reject) => {
    const child = spawn(cmd, { cwd, stdio: "inherit", shell: true });
    child.on("error", reject);
    child.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))));
  });

const items = files.map((f) => f.slice(0, -5)).filter((n) => n !== "registry" && !n.endsWith("-demo"));
let failed = 0;
try {
  for (const flavor of flavors) {
    const dir = path.join(scratch, `app-${flavor}`);
    rmSync(dir, { recursive: true, force: true });
    mkdirSync(scratch, { recursive: true });
    console.log(`\n=== ${flavor}: scaffolding ===`);
    await run(`pnpm create next-app@16.3.5 app-${flavor} --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --turbopack --use-pnpm --yes`, scratch);
    await run(`pnpm dlx shadcn@latest init -y -b ${flavor} -p nova`, dir);
    for (const item of items) {
      console.log(`--- ${flavor}: add ${item}`);
      try {
        await run(`pnpm dlx shadcn@latest add -y -o http://127.0.0.1:${port}/r/${item}.json`, dir);
      } catch {
        failed++;
        console.log(`FAIL ${flavor}: add ${item}`);
      }
    }
    // Every RHS UI file must have landed under an rhs-ui/ folder.
    const uiDir = path.join(dir, "src", "components", "ui", "rhs-ui");
    if (!existsSync(uiDir)) {
      failed++;
      console.log(`FAIL ${flavor}: no src/components/ui/rhs-ui folder after install`);
    }
    // A page that renders the product card, so the typecheck covers usage.
    writeFileSync(
      path.join(dir, "src", "app", "rhs-ui-smoke.tsx"),
      `import { ProductCard } from "@/components/rhs-ui/product-card/product-card";\nimport { Button } from "@/components/ui/rhs-ui/button";\nexport function Smoke() { return <div><Button>Ok</Button><ProductCard product={{ id: "x", title: "x", image: { src: "/x.png", alt: "x" }, price: "1" }} /></div>; }\n`,
    );
    console.log(`=== ${flavor}: typecheck ===`);
    try {
      await run("pnpm exec tsc --noEmit", dir);
    } catch {
      failed++;
      console.log(`FAIL ${flavor}: typecheck`);
    }
  }
} finally {
  server.close();
}

if (failed) {
  console.log(`test-install: ${failed} failure(s)`);
  process.exit(1);
}
console.log(`test-install: ${items.length} item(s) install and typecheck in ${flavors.join(" and ")}`);
