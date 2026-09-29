"use client";

import { useId, useState, type FormEvent } from "react";

import { Avatar, AvatarFallback, initialsOf } from "@rhs-ui/primitives/avatar";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

export interface Comment {
  id: string;
  author: string;
  /** "2 h ago", computed where you know "now". */
  time: string;
  text: string;
  replies?: readonly Comment[];
}

export interface CommentThreadProps {
  comments: readonly Comment[];
  /** Called with the text, and the id of the comment it replies to (null for a new thread). */
  onPost?: (text: string, replyTo: string | null) => void;
  /** The reader's name, for the avatar next to the composer. */
  me?: string;
  className?: string;
}

/**
 * Discussion under a document, a design or a task: comments with one level
 * of replies, a reply box that opens under the comment it answers, and a
 * composer at the end. Each comment is an article with its author and time.
 */
export function CommentThread({ comments, onPost, me = "You", className }: CommentThreadProps) {
  const id = useId();
  const [replying, setReplying] = useState<string | null>(null);
  const post = (event: FormEvent<HTMLFormElement>, replyTo: string | null) => {
    event.preventDefault();
    const form = event.currentTarget;
    const text = String(new FormData(form).get("text") ?? "").trim();
    if (!text) return;
    onPost?.(text, replyTo);
    form.reset();
    setReplying(null);
  };
  const composer = (replyTo: string | null) => (
    <form onSubmit={(event) => post(event, replyTo)} className="flex items-start gap-3">
      <Avatar size="sm">
        <AvatarFallback>{initialsOf(me)}</AvatarFallback>
      </Avatar>
      <div className="grid flex-1 gap-2">
        <label htmlFor={`${id}-${replyTo ?? "new"}`} className="sr-only">
          {replyTo ? "Your reply" : "Add a comment"}
        </label>
        <textarea
          id={`${id}-${replyTo ?? "new"}`}
          name="text"
          rows={2}
          autoFocus={Boolean(replyTo)}
          placeholder={replyTo ? "Write a reply" : "Add a comment"}
          className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40"
        />
        <div className="flex gap-2">
          <Button type="submit" size="sm">
            {replyTo ? "Reply" : "Comment"}
          </Button>
          {replyTo ? (
            <Button type="button" size="sm" variant="ghost" onClick={() => setReplying(null)}>
              Cancel
            </Button>
          ) : null}
        </div>
      </div>
    </form>
  );
  const entry = (comment: Comment, nested: boolean) => (
    <article key={comment.id} aria-label={`${comment.author}, ${comment.time}`} className={cn("flex gap-3", nested && "mt-4")}>
      <Avatar size="sm">
        <AvatarFallback>{initialsOf(comment.author)}</AvatarFallback>
      </Avatar>
      <div className="grid min-w-0 flex-1 gap-1">
        <p className="text-sm">
          <span className="font-medium">{comment.author}</span> <span className="text-xs text-muted-foreground">{comment.time}</span>
        </p>
        <p className="text-sm leading-relaxed">{comment.text}</p>
        {!nested ? (
          <button type="button" aria-label={`Reply to ${comment.author}`} aria-expanded={replying === comment.id} onClick={() => setReplying(comment.id)} className="justify-self-start rounded text-xs font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40">
            Reply
          </button>
        ) : null}
        {comment.replies?.map((reply) => entry(reply, true))}
        {replying === comment.id ? <div className="mt-3">{composer(comment.id)}</div> : null}
      </div>
    </article>
  );
  return (
    <section data-slot="comment-thread" aria-label="Comments" className={cn("grid gap-6", className)}>
      {comments.map((comment) => entry(comment, false))}
      <div className="border-t border-border pt-5">{composer(null)}</div>
    </section>
  );
}
