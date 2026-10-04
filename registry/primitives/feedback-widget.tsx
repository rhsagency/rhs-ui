"use client";

import { useId, useState } from "react";

import { IconThumbsDown, IconThumbsUp } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { Textarea } from "@rhs-ui/primitives/textarea";
import { cn } from "@/lib/utils";

export interface FeedbackWidgetProps {
  /** "Was this page helpful?" */
  question?: string;
  /** Resolve when stored. The comment is optional and may be empty. */
  onSubmit: (vote: "up" | "down", comment: string) => Promise<void> | void;
  className?: string;
}

/**
 * "Was this helpful?" at the bottom of a doc or help article: thumbs up or
 * down as pressed buttons, then an optional line of feedback (asking what
 * was missing when it was a no), and a thank-you that replaces the widget.
 * One click is enough; the comment is never required.
 */
export function FeedbackWidget({ question = "Was this page helpful?", onSubmit, className }: FeedbackWidgetProps) {
  const id = useId();
  const [vote, setVote] = useState<"up" | "down" | null>(null);
  const [comment, setComment] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  async function send(nextVote: "up" | "down", text: string) {
    setState("busy");
    try {
      await onSubmit(nextVote, text);
    } finally {
      setState("done");
    }
  }
  if (state === "done") return <p data-slot="feedback-widget" role="status" className={cn("text-sm text-muted-foreground", className)}>Thanks for letting us know.</p>;
  const thumb = "inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40 aria-pressed:border-foreground aria-pressed:bg-foreground aria-pressed:text-background [&_svg]:size-4";
  return (
    <div data-slot="feedback-widget" className={cn("grid gap-3", className)}>
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-sm font-medium">{question}</p>
        <button type="button" aria-pressed={vote === "up"} onClick={() => setVote("up")} className={thumb}><IconThumbsUp aria-hidden="true" />Yes</button>
        <button type="button" aria-pressed={vote === "down"} onClick={() => setVote("down")} className={thumb}><IconThumbsDown aria-hidden="true" />No</button>
      </div>
      {vote ? (
        <form onSubmit={(event) => { event.preventDefault(); void send(vote, comment.trim()); }} className="grid max-w-md gap-2">
          <label htmlFor={id} className="text-sm text-muted-foreground">{vote === "down" ? "What was missing or wrong? (optional)" : "Anything we could add? (optional)"}</label>
          <Textarea id={id} value={comment} onChange={(event) => setComment(event.target.value)} rows={3} maxLength={1000} />
          <Button type="submit" size="sm" loading={state === "busy"} className="justify-self-start">Send</Button>
        </form>
      ) : null}
    </div>
  );
}
