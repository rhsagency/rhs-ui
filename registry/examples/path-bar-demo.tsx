"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { IconFolder } from "@rhs-ui/icons";
import { PathBar, type PathSegment } from "@rhs-ui/primitives/path-bar";

/** The folders of a small storage bucket: each path and the folders inside it. */
const TREE: Readonly<Record<string, readonly string[]>> = {
  "/": ["projects", "archive", "shared"],
  "/projects": ["northwind", "halcyon", "kestrel"],
  "/projects/northwind": ["assets", "docs", "contracts"],
  "/projects/northwind/assets": ["brand", "photos", "icons"],
  "/projects/northwind/assets/photos": ["2026-spring", "2025-autumn"],
  "/projects/northwind/docs": ["briefs", "minutes"],
  "/projects/halcyon": ["assets", "docs"],
  "/archive": ["2024", "2025"],
};

const parentOf = (path: string) => (path.lastIndexOf("/") <= 0 ? "/" : path.slice(0, path.lastIndexOf("/")));
const nameOf = (path: string) => path.slice(path.lastIndexOf("/") + 1);
const exists = (path: string) => path === "/" || (TREE[parentOf(path)]?.includes(nameOf(path)) ?? false);
/** "projects//northwind/" and "/projects/northwind" are the same place. */
const normalize = (raw: string) => `/${raw.split("/").filter(Boolean).join("/")}`;

function segmentsOf(path: string): PathSegment[] {
  const parts = path.split("/").filter(Boolean);
  return [{ label: "Storage", path: "/" }, ...parts.map((label, index) => ({ label, path: `/${parts.slice(0, index + 1).join("/")}` }))];
}

/** Why a typed path is refused: the first folder along it that is not there. */
function problemWith(raw: string): string | null {
  const path = normalize(raw);
  if (exists(path)) return null;
  let missing = path;
  while (!exists(parentOf(missing))) missing = parentOf(missing);
  return `There is no folder called “${nameOf(missing)}” in ${parentOf(missing)}.`;
}

const DEEP = ["Storage", "projects", "northwind", "assets", "photos", "2026-spring", "exports", "web", "hero-banner-final"];
const DEEP_SEGMENTS: PathSegment[] = DEEP.map((label, index) => ({ label, path: index === 0 ? "/" : `/${DEEP.slice(1, index + 1).join("/")}` }));
const DEEP_VALUE = `/${DEEP.slice(1).join("/")}`;

const BUCKET: PathSegment[] = [
  { label: "northwind-assets", path: "/", href: "#bucket" },
  { label: "brand", path: "/brand", href: "#bucket-brand" },
  { label: "logos", path: "/brand/logos", href: "#bucket-logos" },
  { label: "wordmarks", path: "/brand/logos/wordmarks" },
];

function noop() {}

function Example({ caption, children }: { caption: ReactNode; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start justify-items-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

function Browser(): React.JSX.Element {
  const [path, setPath] = useState("/projects/northwind/assets");
  const inside = TREE[path] ?? [];
  const list = useRef<HTMLUListElement>(null);
  const empty = useRef<HTMLParagraphElement>(null);
  /** Set when a folder of the list was opened: the button that was pressed is gone with the old list, so focus goes to the new one. */
  const drilled = useRef(false);
  useEffect(() => {
    if (!drilled.current) return;
    drilled.current = false;
    (list.current?.querySelector<HTMLElement>("button") ?? empty.current)?.focus({ preventScroll: true });
  }, [path]);
  return (
    <div className="w-full rounded-xl border border-border bg-card p-3 text-card-foreground shadow-xs sm:p-4">
      <PathBar
        segments={segmentsOf(path)}
        value={path}
        copyable
        aria-label="Storage location"
        onNavigate={setPath}
        onEditSubmit={(typed) => setPath(normalize(typed))}
        validate={problemWith}
      />
      {inside.length ? (
        <ul ref={list} className="mt-3 grid gap-0.5 sm:grid-cols-2">
          {inside.map((name) => (
            <li key={name}>
              <button
                type="button"
                onClick={() => {
                  drilled.current = true;
                  setPath(path === "/" ? `/${name}` : `${path}/${name}`);
                }}
                className="flex h-9 w-full items-center gap-2.5 rounded-md px-2.5 text-left text-sm outline-none transition-colors duration-150 hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none"
              >
                <IconFolder className="size-4 shrink-0 text-muted-foreground" />
                <span className="truncate">{name}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p ref={empty} tabIndex={-1} className="mt-4 rounded-md pb-1 text-center text-sm text-muted-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40">
          This folder is empty.
        </p>
      )}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-3xl gap-x-12 gap-y-9 [grid-template-columns:repeat(auto-fit,minmax(min(100%,19rem),1fr))]">
      <div className="min-w-0 [grid-column:1/-1]">
        <Example caption="Press a part to go there. Press Edit or click the empty space to type a path (Ctrl L does it while the bar has focus): try /projects/northwind/docs, or a folder that does not exist. Escape goes back.">
          <Browser />
        </Example>
      </div>

      <Example caption="A path longer than the bar folds its middle into the “…” menu, and the last part always stays.">
        <div className="w-full max-w-md">
          <PathBar segments={DEEP_SEGMENTS} value={DEEP_VALUE} copyable aria-label="Deep location" onNavigate={noop} />
        </div>
      </Example>

      <Example caption="The same path in a narrower bar: first the middle, then the first part gives way.">
        <div className="w-full max-w-[17rem]">
          <PathBar segments={DEEP_SEGMENTS} value={DEEP_VALUE} aria-label="Deep location, narrow" onNavigate={noop} />
        </div>
      </Example>

      <div className="min-w-0 [grid-column:1/-1]">
        <Example caption="Parts with an href are real links, so they open in a new tab. The separator is yours.">
          <div className="w-full max-w-lg">
            <PathBar segments={BUCKET} value="/brand/logos/wordmarks" separator="›" copyable aria-label="Bucket location" onNavigate={noop} />
          </div>
        </Example>
      </div>
    </div>
  );
}
