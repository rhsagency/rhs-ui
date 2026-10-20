"use client";

import { useRef, useState, type ReactNode } from "react";

import { Input } from "@rhs-ui/primitives/input";
import { ShortcutButton } from "@rhs-ui/primitives/shortcut-button";
import { Textarea } from "@rhs-ui/primitives/textarea";

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const [last, setLast] = useState("Press a shortcut, or click a button.");
  const [reply, setReply] = useState("");
  const [sent, setSent] = useState("Nothing sent yet.");
  const panel = useRef<HTMLDivElement>(null);
  const log = (what: string) => (source: "pointer" | "shortcut") => setLast(`${what}, from the ${source === "shortcut" ? "keyboard" : "pointer"}.`);

  return (
    <div className="grid w-full max-w-3xl gap-x-12 gap-y-9 [grid-template-columns:repeat(auto-fit,minmax(min(100%,21rem),1fr))]">
      <Example caption="Press the keys anywhere on the page, or click">
        <div className="grid gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <ShortcutButton shortcut="mod+j" label="Jump to" onAction={log("Jumped to Kestrel Foods")} />
            <ShortcutButton shortcut="c" label="New issue" variant="default" onAction={log("Started a new issue")} />
            <ShortcutButton shortcut="g i" label="Go to inbox" variant="secondary" onAction={log("Went to the inbox")} />
            <ShortcutButton shortcut="e" label="Archive" disabled onAction={log("Archived")} />
          </div>
          <Input aria-label="Draft a comment" placeholder="Typing here fires nothing" />
          <p role="status" className="text-xs text-muted-foreground">
            {last}
          </p>
        </div>
      </Example>

      <Example caption="Scoped to a panel, and allowed inside its text box">
        <div ref={panel} className="grid gap-3 rounded-xl border border-border bg-card p-3 shadow-xs">
          <Textarea aria-label="Reply to Halcyon Labs" rows={3} value={reply} onChange={(event) => setReply(event.target.value)} placeholder="Reply to Halcyon Labs…" className="min-h-20 resize-none" />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p role="status" className="min-w-0 truncate text-xs text-muted-foreground">
              {sent}
            </p>
            <ShortcutButton
              scope={panel}
              allowInInputs
              shortcut="mod+enter"
              label="Send reply"
              variant="default"
              size="sm"
              onAction={() => {
                setSent(reply.trim() ? `Sent: “${reply.trim().slice(0, 28)}${reply.trim().length > 28 ? "…" : ""}”` : "Write something first.");
                if (reply.trim()) setReply("");
              }}
            />
          </div>
        </div>
      </Example>
    </div>
  );
}
