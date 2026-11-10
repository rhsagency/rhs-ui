"use client";

import { useState, type ReactNode } from "react";

import { Input } from "@rhs-ui/primitives/input";
import { Label } from "@rhs-ui/primitives/label";
import { PatternCover } from "@rhs-ui/primitives/pattern-cover";

const PLAYLISTS = [
  { name: "Low Tide", meta: "Halcyon Sessions" },
  { name: "Focus, but warm", meta: "42 tracks" },
  { name: "Sunday cooking", meta: "Northwind Radio" },
  { name: "Night drive", meta: "28 tracks" },
  { name: "First light", meta: "Kestrel Studio" },
  { name: "Long haul", meta: "113 tracks" },
];

const WORKSPACES = [
  { name: "Kestrel Studio", meta: "12 members", id: "ws_kestrel-studio" },
  { name: "Northwind Labs", meta: "48 members", id: "ws_northwind-labs" },
  { name: "Halcyon Quay", meta: "5 members", id: "ws_halcyon-quay" },
];

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-1 content-start gap-4">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const [seed, setSeed] = useState("Morning run");
  return (
    <div className="grid w-full max-w-3xl grid-cols-1 gap-12">
      <Example caption="The seed draws the cover: type anything, and the same text always gives the same one.">
        <div className="grid grid-cols-1 gap-6 rounded-xl border border-border p-5 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center sm:gap-8 sm:p-6">
          <PatternCover seed={seed} size={152} label={`Cover for the seed ${seed}`} className="mx-auto sm:mx-0" />
          <div className="grid min-w-0 gap-5">
            <div className="grid gap-2">
              <Label htmlFor="cover-seed">Seed</Label>
              <Input id="cover-seed" value={seed} onChange={(event) => setSeed(event.target.value)} spellCheck={false} autoComplete="off" />
            </div>
            <div className="flex flex-wrap items-end gap-x-4 gap-y-3" aria-label="The same cover at four sizes and as a circle" role="group">
              {[24, 36, 52, 72].map((size) => (
                <PatternCover key={size} seed={seed} size={size} />
              ))}
              <PatternCover seed={seed} shape="round" size={52} />
            </div>
          </div>
        </div>
      </Example>

      <Example caption="A shelf of playlists with no artwork: each name has its own cover, light or dark, and keeps it.">
        <ul className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-6">
          {PLAYLISTS.map((playlist) => (
            <li key={playlist.name} className="grid min-w-0 gap-2.5">
              <PatternCover seed={playlist.name} size="100%" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium tracking-[-0.01em]">{playlist.name}</p>
                <p className="truncate text-xs text-muted-foreground">{playlist.meta}</p>
              </div>
            </li>
          ))}
        </ul>
      </Example>

      <Example caption='shape="round" for people and places: the fallback for a workspace or a project with no logo.'>
        <ul className="divide-y divide-border rounded-xl border border-border">
          {WORKSPACES.map((workspace) => (
            <li key={workspace.id} className="flex items-center gap-3.5 px-4 py-3">
              <PatternCover seed={workspace.id} shape="round" size={40} />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium tracking-[-0.01em]">{workspace.name}</p>
                <p className="truncate text-xs text-muted-foreground tabular-nums">{workspace.meta}</p>
              </div>
            </li>
          ))}
        </ul>
      </Example>
    </div>
  );
}
