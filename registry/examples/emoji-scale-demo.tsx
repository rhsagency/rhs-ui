"use client";

import { useState, type ReactNode } from "react";

import { Button } from "@rhs-ui/primitives/button";
import { EmojiScale } from "@rhs-ui/primitives/emoji-scale";
import { Label } from "@rhs-ui/primitives/label";
import { Textarea } from "@rhs-ui/primitives/textarea";

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-1 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

const card = "grid grid-cols-1 gap-5 rounded-xl border border-border bg-card p-5 shadow-xs";

function Delivery(): React.JSX.Element {
  const [mood, setMood] = useState<number | null>(2);
  const [sent, setSent] = useState(false);
  return (
    <div className={card}>
      <div className="grid gap-1">
        <h2 className="text-sm font-medium tracking-[-0.01em]">Order 48213 arrived</h2>
        <p className="text-xs text-muted-foreground">Kestrel Outdoor delivered your tent and two sleeping mats this morning.</p>
      </div>
      <EmojiScale
        legend="How was your delivery?"
        name="delivery"
        value={mood}
        onValueChange={(next) => {
          setMood(next);
          setSent(false);
        }}
      />
      {mood !== null && mood <= 2 ? (
        <div className="grid gap-2 border-t border-border pt-5">
          <Label htmlFor="what-went-wrong">We are sorry to hear that. What went wrong?</Label>
          <Textarea id="what-went-wrong" rows={3} placeholder="The box was damaged, the courier was late, something was missing" />
          <div className="flex items-center justify-between gap-3">
            <p role="status" className="text-xs text-muted-foreground">
              {sent ? "Thank you. Support will write to you today." : "A person reads every answer."}
            </p>
            <Button type="button" size="sm" disabled={sent} onClick={() => setSent(true)}>
              Send feedback
            </Button>
          </div>
        </div>
      ) : (
        <p role="status" className="border-t border-border pt-5 text-xs text-muted-foreground">
          {mood === null ? "Choose a face and a follow-up question appears for the low ones." : "Thank you. We have noted it."}
        </p>
      )}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const [article, setArticle] = useState<number | null>(null);
  return (
    <div className="grid w-full max-w-4xl grid-cols-1 gap-x-10 gap-y-9 md:grid-cols-2 md:items-start">
      <div className="grid min-w-0 content-start gap-9">
        <Example caption="Try it: point at a face to read its word, or Tab in and use the arrow keys, which move and choose. A low score asks a follow-up.">
          <Delivery />
        </Example>
        <Example caption="Your own words, set as the starting answer, and controlled from outside">
          <div className={card}>
            <EmojiScale legend="How useful was this article?" labels={["Not at all", "A little", "Somewhat", "Quite", "Very"]} value={article ?? 4} onValueChange={setArticle} />
          </div>
        </Example>
      </div>

      <div className="grid min-w-0 content-start gap-9">
        <Example caption="Three sizes: small for a table row, medium for a form, large for a page of its own. Every face is a target of 44px or more.">
          <div className={card}>
            <EmojiScale size="sm" legend="Rate this reply" defaultValue={3} />
            <EmojiScale size="md" legend="Rate this article" defaultValue={4} />
            <EmojiScale size="lg" legend="How was your stay at Kestrel Lodge?" defaultValue={5} />
          </div>
        </Example>
        <Example caption="Without the word line the faces stand alone and the words are still read out. And disabled.">
          <div className={card}>
            <EmojiScale showLabels={false} legend="Mood at standup" />
            <EmojiScale disabled legend="Closed for feedback" defaultValue={4} />
          </div>
        </Example>
      </div>
    </div>
  );
}
