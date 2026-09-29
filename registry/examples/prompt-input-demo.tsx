"use client";

import { useRef, useState } from "react";

import { PromptInput } from "@rhs-ui/application/prompt-input";

export default function PromptInputDemo() {
  const [busy, setBusy] = useState(false);
  const [asked, setAsked] = useState<string | null>(null);
  const [attached, setAttached] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  return (
    <div className="grid w-full max-w-lg gap-3">
      <PromptInput
        busy={busy}
        onSubmit={(text) => {
          setAsked(text);
          setBusy(true);
          timer.current = setTimeout(() => setBusy(false), 2400);
        }}
        onStop={() => {
          clearTimeout(timer.current);
          setBusy(false);
        }}
        onAttach={() => setAttached((count) => count + 1)}
        placeholder="Ask about your data"
        toolbar={<span className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">{attached ? `${attached} file${attached > 1 ? "s" : ""} attached` : "Model: Fast"}</span>}
      />
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {busy ? `Answering “${asked}”…` : asked ? "Stopped or done. Ask something else." : "Enter sends, Shift+Enter adds a line."}
      </p>
    </div>
  );
}
