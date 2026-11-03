"use client";

import { useEffect, useState, type ReactNode } from "react";

import { SegmentedControl } from "@rhs-ui/application/segmented-control";
import { Label } from "@rhs-ui/primitives/label";
import { ShortcutRecorder, type ShortcutPlatform } from "@rhs-ui/primitives/shortcut-recorder";
import { detectPlatform } from "@rhs-ui/primitives/shortcut-recorder/shortcut";

interface Action {
  id: string;
  label: string;
  description: string;
}

const ACTIONS: readonly Action[] = [
  { id: "search", label: "Open search", description: "Find a project, a person or a setting" },
  { id: "new-project", label: "New project", description: "Start from a blank project" },
  { id: "sidebar", label: "Toggle sidebar", description: "Show or hide the project list" },
  { id: "inbox", label: "Go to inbox", description: "Jump to your unread notifications" },
  { id: "switcher", label: "Quick switcher", description: "Hop between your last few projects" },
];

/** What the browser keeps for itself, with the reason in words. */
const RESERVED = {
  "Mod+W": "Closes the tab",
  "Mod+T": "Opens a new tab",
  "Mod+N": "Opens a new window",
  "Mod+L": "Selects the address bar",
};

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  // Until someone flips the toggle, the fields read the keyboard from the browser themselves (that is what the component does
  // by default), so Ctrl+K on a PC meets "Open search" straight away. The toggle only has to know what to show: Mac on the server,
  // then the real platform once the page has mounted.
  const [chosen, setChosen] = useState<"mac" | "windows" | null>(null);
  const [detected, setDetected] = useState<"mac" | "windows">("mac");
  useEffect(() => {
    setDetected(detectPlatform() === "mac" ? "mac" : "windows");
  }, []);
  const toggle = chosen ?? detected;
  const platform: ShortcutPlatform | undefined = chosen ?? undefined;
  const [shortcuts, setShortcuts] = useState<Record<string, string | null>>({
    search: "Mod+K",
    "new-project": "Mod+Shift+N",
    sidebar: "Mod+B",
    inbox: "Mod+Shift+I",
    switcher: null,
  });
  const [single, setSingle] = useState<string | null>("Mod+Alt+ArrowRight");
  const ownerOf = (shortcut: string, id: string): string | undefined => ACTIONS.find((action) => action.id !== id && shortcuts[action.id] === shortcut)?.label;
  return (
    <div className="grid w-full max-w-4xl grid-cols-1 gap-x-12 gap-y-10 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <Example caption="Try it: click a field and press the keys. Escape cancels, Backspace clears and Tab moves on. A combination another row uses, or the browser keeps, is refused.">
        <section aria-labelledby="shortcuts-title" className="rounded-xl border border-border bg-card shadow-xs">
          <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-b border-border px-4 py-3.5 sm:px-5">
            <div>
              <h2 id="shortcuts-title" className="text-base font-semibold tracking-[-0.02em]">
                Keyboard shortcuts
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">Make Halcyon work the way your hands do.</p>
            </div>
            <SegmentedControl
              label="Keyboard"
              value={toggle}
              onValueChange={(next) => setChosen(next === "mac" ? "mac" : "windows")}
              options={[
                { value: "mac", label: "Mac" },
                { value: "windows", label: "Windows" },
              ]}
            />
          </header>
          {/* Rows are top-aligned, so a label stays put when a refusal appears under its field and makes the row taller. */}
          <ul className="divide-y divide-border">
            {ACTIONS.map((action) => (
              <li key={action.id} className="grid gap-3 px-4 py-3.5 sm:grid-cols-[minmax(0,1fr)_14rem] sm:items-start sm:gap-6 sm:px-5">
                <div className="min-w-0">
                  <Label htmlFor={`shortcut-${action.id}`}>{action.label}</Label>
                  <p className="mt-1.5 text-xs text-muted-foreground">{action.description}</p>
                </div>
                <ShortcutRecorder
                  id={`shortcut-${action.id}`}
                  platform={platform}
                  value={shortcuts[action.id] ?? null}
                  onValueChange={(next) => setShortcuts((current) => ({ ...current, [action.id]: next }))}
                  reserved={RESERVED}
                  findConflict={(shortcut) => ownerOf(shortcut, action.id)}
                />
              </li>
            ))}
          </ul>
          <footer className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t border-border bg-muted/40 px-4 py-2.5 text-xs text-muted-foreground sm:px-5">
            <span>Reported for Open search</span>
            <code role="status" className="font-mono text-[0.6875rem] text-foreground">
              {JSON.stringify(shortcuts.search ?? null)}
            </code>
          </footer>
        </section>
      </Example>

      <div className="grid min-w-0 content-start gap-10">
        <Example caption="A key alone is refused, so a plain letter never becomes a shortcut. Function keys are fine.">
          <div className="grid gap-2">
            <Label htmlFor="shortcut-single">Skip to next unread</Label>
            <ShortcutRecorder id="shortcut-single" platform={platform} requireModifier value={single} onValueChange={setSingle} />
          </div>
        </Example>
        <Example caption="Disabled, and marked invalid by your own form.">
          <div className="grid gap-5">
            <div className="grid gap-2">
              <Label htmlFor="shortcut-locked">Command palette</Label>
              <ShortcutRecorder id="shortcut-locked" platform={platform} defaultValue="Mod+Shift+P" disabled />
              <p className="text-xs text-muted-foreground">Locked by your admin.</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="shortcut-invalid">Mute notifications</Label>
              <ShortcutRecorder id="shortcut-invalid" platform={platform} invalid aria-describedby="shortcut-invalid-hint" />
              <p id="shortcut-invalid-hint" className="text-xs font-medium text-destructive">
                Pick a shortcut before you turn this on.
              </p>
            </div>
          </div>
        </Example>
      </div>
    </div>
  );
}
