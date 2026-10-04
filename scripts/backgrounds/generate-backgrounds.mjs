/**
 * Writes the Free backgrounds from free-painters.mjs into the registry: the
 * component file, a demo and the registry entry (with tagline, use and mood
 * for the gallery). Existing entries are updated in place, so running it
 * again after editing a painter is safe.
 *
 *   node scripts/backgrounds/generate-backgrounds.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { FREE_BACKGROUNDS } from "./free-painters.mjs";

const root = path.resolve(import.meta.dirname, "..", "..");
const pascal = (name) => name.split("-").map((part) => part[0].toUpperCase() + part.slice(1)).join("");
/** The mood of the backgrounds that existed before this generator, for the gallery filter. */
const EXISTING_MOODS = { "dot-field": "calm", "contour-field": "organic", "orbit-field": "cosmic", "architect-grid": "technical", "flow-field": "organic", "particle-network": "technical", "beam-grid": "technical", "signal-bars": "data" };
export const MOODS = ["calm", "technical", "cosmic", "organic", "data"];

for (const item of FREE_BACKGROUNDS) {
  if (!MOODS.includes(item.mood)) throw new Error(`${item.name}: mood must be one of ${MOODS.join(", ")}`);
  const component = pascal(item.name);
  const source = `"use client";
import { BackgroundCanvas, type BackgroundCanvasProps, type Painter } from "@rhs-ui/backgrounds/background-canvas";
${item.helpers ?? ""}
/** ${item.description} */
const paint: Painter = ({ ctx, width, height, time }) => {${item.body}
};

export function ${component}(props: Omit<BackgroundCanvasProps, "pattern" | "paint">): React.JSX.Element {
  return <BackgroundCanvas paint={paint} {...props} />;
}
`;
  writeFileSync(path.join(root, "registry", "backgrounds", `${item.name}.tsx`), source.replace(/\n{3,}/g, "\n\n"));
  const index = FREE_BACKGROUNDS.indexOf(item);
  const tone = index % 4 === 1 || index % 4 === 2 ? "bg-foreground text-background" : "bg-muted";
  writeFileSync(
    path.join(root, "registry", "examples", `${item.name}-demo.tsx`),
    `"use client";
import { useState } from "react";
import { ${component} } from "@rhs-ui/backgrounds/${item.name}";

export default function Demo(): React.JSX.Element {
  const [paused, setPaused] = useState(false);
  return (
    <div className="w-full">
      <${component} paused={paused} className="flex min-h-80 items-center justify-center rounded-xl border border-border ${tone}">
        <div className="px-8 py-6 text-center">
          <p className="text-xs uppercase tracking-widest opacity-70">${item.title}</p>
          <p className="mt-3 text-3xl font-medium tracking-tight">${item.tagline}</p>
        </div>
      </${component}>
      <button type="button" aria-pressed={paused} onClick={() => setPaused(!paused)} className="mt-4 rounded-lg border border-border px-4 py-2 text-sm">
        {paused ? "Resume motion" : "Pause motion"}
      </button>
    </div>
  );
}
`,
  );
}

const file = path.join(root, "registry", "backgrounds", "registry.json");
const registry = JSON.parse(readFileSync(file, "utf8"));
for (const entry of registry.items) if (EXISTING_MOODS[entry.name]) entry.meta.mood = EXISTING_MOODS[entry.name];
for (const item of FREE_BACKGROUNDS) {
  const entry = {
    name: item.name, type: "registry:component", title: item.title, description: item.description, categories: ["backgrounds"],
    meta: { tier: "free", version: "0.5.0", since: "0.5.0", status: "stable", preview: "inline", tagline: item.tagline, use: item.use, mood: item.mood },
    dependencies: [], registryDependencies: ["https://rhsui.com/r/background-canvas.json"],
    files: [{ path: `registry/backgrounds/${item.name}.tsx`, type: "registry:component", target: `components/rhs-ui/backgrounds/${item.name}.tsx` }],
  };
  const demo = {
    name: `${item.name}-demo`, type: "registry:example", title: `${item.title} demo`, description: `A working preview of ${item.title}.`,
    registryDependencies: [`https://rhsui.com/r/${item.name}.json`],
    files: [{ path: `registry/examples/${item.name}-demo.tsx`, type: "registry:example" }],
  };
  for (const next of [entry, demo]) {
    const at = registry.items.findIndex((existing) => existing.name === next.name);
    if (at >= 0) registry.items[at] = next;
    else registry.items.splice(registry.items.findIndex((existing) => existing.name === "background-canvas"), 0, next);
  }
}
writeFileSync(file, JSON.stringify(registry, null, 2) + "\n");
console.log(`generate-backgrounds: ${FREE_BACKGROUNDS.length} backgrounds written, ${registry.items.filter((i) => i.type === "registry:component").length} in the registry`);
