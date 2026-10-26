"use client";

import { useState } from "react";

import { SegmentedControl } from "@rhs-ui/application/segmented-control";
import { TypingIndicator } from "@rhs-ui/application/typing-indicator";
import { Avatar, AvatarFallback, initialsOf } from "@rhs-ui/primitives/avatar";
import { cn } from "@/lib/utils";

const SCENES = {
  nobody: { label: "Nobody", people: [] },
  one: { label: "One", people: ["Anna"] },
  two: { label: "Two", people: ["Anna", "Tom"] },
  four: { label: "Four", people: ["Anna", "Tom", "Mia", "Jonas"] },
} as const;

type Scene = keyof typeof SCENES;

const OPTIONS = (Object.keys(SCENES) as Scene[]).map((value) => ({ value, label: SCENES[value].label }));

function Message({ name, own = false, children }: { name: string; own?: boolean; children: string }): React.JSX.Element {
  return (
    <div className={cn("flex items-end gap-2", own && "justify-end")}>
      {own ? null : (
        <Avatar size="sm" aria-hidden="true">
          <AvatarFallback>{initialsOf(name)}</AvatarFallback>
        </Avatar>
      )}
      <p className={cn("max-w-[78%] rounded-2xl px-3.5 py-2 text-sm leading-snug", own ? "rounded-ee-md bg-primary text-primary-foreground" : "rounded-es-md bg-muted text-foreground")}>
        <span className="sr-only">{name}: </span>
        {children}
      </p>
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const [scene, setScene] = useState<Scene>("two");

  return (
    <div className="mx-auto grid w-full max-w-md gap-8">
      <div className="grid gap-4">
        <section aria-label="Northwind design review chat" className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs">
          <div className="flex items-baseline justify-between gap-3 border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold tracking-[-0.01em]">Checkout redesign</h2>
            <p className="text-xs text-muted-foreground">5 members</p>
          </div>
          <div className="grid gap-3 px-4 pt-4">
            <Message name="Tom Brandt">Pushed the new checkout flow to staging. Can someone click through it before standup?</Message>
            <Message name="You" own>
              On it. Starting with the guest cart.
            </Message>
            <Message name="Anna de Vries">I will take the saved-card path.</Message>
          </div>
          <div className="px-4 pt-1.5 pb-2.5">
            <TypingIndicator people={SCENES[scene].people} />
          </div>
          <div className="border-t border-border p-3">
            <p className="flex h-9 items-center rounded-md border border-input bg-background px-3 text-sm text-muted-foreground">Write a message</p>
          </div>
        </section>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="text-xs text-muted-foreground">Who is typing</span>
          <SegmentedControl label="Who is typing" options={OPTIONS} value={scene} onValueChange={(value) => setScene(value as Scene)} />
        </div>
      </div>

      <div className="grid gap-3">
        <p className="text-xs text-muted-foreground">The sentence follows the list. The dashed box is the height the line keeps when it is quiet.</p>
        <ul className="grid gap-2.5">
          {[
            { caption: "One person", people: ["Anna"], props: {} },
            { caption: "Four people, max 2", people: ["Anna", "Tom", "Mia", "Jonas"], props: {} },
            { caption: "Three people, max 2: the third is named", people: ["Anna", "Tom", "Mia"], props: {} },
            { caption: 'label="replying", max 1', people: ["Priya", "Jonas", "Mia"], props: { label: "replying", max: 1 } },
            { caption: "Nobody", people: [], props: {} },
          ].map((row) => (
            <li key={row.caption} className="grid gap-1">
              <span className="text-xs text-muted-foreground">{row.caption}</span>
              <TypingIndicator people={row.people} {...row.props} className="rounded-md border border-dashed border-border px-2" />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
