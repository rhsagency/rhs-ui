"use client";

import { useState, type ReactNode } from "react";

import { IconClock, IconCopy, IconFile, IconMail, IconSave, IconSend, IconTrash } from "@rhs-ui/icons";
import { SplitButton } from "@rhs-ui/primitives/split-button";

function Example({ caption, note, children }: { caption: string; note?: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start justify-items-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
      {note ? (
        <p role="status" className="min-h-4 text-xs text-muted-foreground tabular-nums">
          {note}
        </p>
      ) : null}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const [saved, setSaved] = useState("Nothing saved yet.");
  const [published, setPublished] = useState<string | null>(null);
  const [lastPublish, setLastPublish] = useState("Nothing published yet.");

  return (
    <div className="grid w-full max-w-3xl gap-x-12 gap-y-9 [grid-template-columns:repeat(auto-fit,minmax(min(100%,19rem),1fr))]">
      <Example caption="One click does the common thing, the menu holds the rest" note={saved}>
        <SplitButton
          label="Save"
          icon={<IconSave />}
          onAction={() => setSaved("Saved to Q4 launch plan.")}
          items={[
            { label: "Save as draft", icon: <IconFile />, onSelect: () => setSaved("Saved as a draft.") },
            { label: "Save and close", icon: <IconSave />, onSelect: () => setSaved("Saved. Closing the document.") },
            { label: "Save as template", icon: <IconCopy />, onSelect: () => setSaved("Saved as a template.") },
            { label: "Discard changes", icon: <IconTrash />, destructive: true, separatorBefore: true, onSelect: () => setSaved("Changes discarded.") },
          ]}
        />
      </Example>

      <Example caption="Remembers the last choice" note={lastPublish}>
        <SplitButton
          variant="outline"
          label="Publish now"
          icon={<IconSend />}
          remember
          rememberedId={published}
          onRememberChange={setPublished}
          onAction={() => setLastPublish("Published to 4,820 subscribers.")}
          items={[
            { id: "schedule", label: "Schedule for later", icon: <IconClock />, onSelect: () => setLastPublish("Scheduled for Monday, 9:00.") },
            { id: "notify", label: "Publish and notify the team", icon: <IconMail />, onSelect: () => setLastPublish("Published. The team has been notified.") },
          ]}
        />
      </Example>

      <Example caption="Busy: only the main button waits">
        <SplitButton label="Export report" loading items={[{ label: "Export as CSV" }, { label: "Export as PDF" }]} />
      </Example>

      <Example caption="Main button disabled, menu still reachable">
        <SplitButton label="Send invoice" disabled items={[{ label: "Save as draft", icon: <IconFile /> }, { label: "Schedule send", icon: <IconClock /> }]} />
      </Example>

      <Example caption="Sizes and variants">
        <div className="flex flex-wrap items-center gap-3">
          <SplitButton size="sm" variant="secondary" label="Reply" items={[{ label: "Reply all" }, { label: "Forward" }]} />
          <SplitButton variant="outline" label="Share" items={[{ label: "Copy link" }, { label: "Invite by email" }]} />
          <SplitButton size="lg" label="Start trial" items={[{ label: "Talk to sales" }, { label: "See pricing" }]} />
        </div>
      </Example>
    </div>
  );
}
