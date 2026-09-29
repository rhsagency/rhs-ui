"use client";

import { useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from "react";

import { IconArrowUp, IconPaperclip, IconStop } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface PromptInputProps {
  /** Called with the text when the reader sends. */
  onSubmit: (text: string) => void;
  /** While the answer streams: the send button becomes a stop button. */
  busy?: boolean;
  onStop?: () => void;
  /** Adds an attach button; you open your own file picker. */
  onAttach?: () => void;
  placeholder?: string;
  /** Controls under the field: a model picker, a toggle for web search. */
  toolbar?: ReactNode;
  maxLength?: number;
  label?: string;
  className?: string;
}

/**
 * The composer of an AI product: a field that grows with the text, Enter to
 * send and Shift+Enter for a new line, a send button that turns into stop
 * while the answer streams, and room for your own controls. It keeps the
 * text on an error; clearing is up to a successful send.
 */
export function PromptInput({ onSubmit, busy = false, onStop, onAttach, placeholder = "Ask anything", toolbar, maxLength = 4000, label = "Message", className }: PromptInputProps) {
  const [text, setText] = useState("");
  const field = useRef<HTMLTextAreaElement>(null);
  const send = (event?: FormEvent) => {
    event?.preventDefault();
    const value = text.trim();
    if (!value || busy) return;
    onSubmit(value);
    setText("");
    requestAnimationFrame(() => field.current?.focus());
  };
  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      send();
    }
  };
  const nearLimit = text.length > maxLength * 0.9;
  return (
    <form
      data-slot="prompt-input"
      onSubmit={send}
      className={cn("grid gap-2 rounded-2xl border border-input bg-background p-2 shadow-sm transition-[border-color,box-shadow] has-[textarea:focus-visible]:border-ring has-[textarea:focus-visible]:ring-[3px] has-[textarea:focus-visible]:ring-ring/40", className)}
    >
      <textarea
        ref={field}
        aria-label={label}
        value={text}
        maxLength={maxLength}
        rows={1}
        placeholder={placeholder}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={onKeyDown}
        className="max-h-48 min-h-11 w-full resize-none bg-transparent px-2 py-2 text-sm leading-relaxed outline-none [field-sizing:content] placeholder:text-muted-foreground"
      />
      <div className="flex items-center gap-2">
        {onAttach ? (
          <button type="button" aria-label="Attach a file" onClick={onAttach} className="grid size-8 place-items-center rounded-lg text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40">
            <IconPaperclip size={16} />
          </button>
        ) : null}
        <div className="flex min-w-0 flex-1 items-center gap-2">{toolbar}</div>
        {nearLimit ? <span className="text-xs tabular-nums text-muted-foreground">{maxLength - text.length} left</span> : null}
        {busy ? (
          <button type="button" aria-label="Stop generating" onClick={onStop} className="grid size-8 place-items-center rounded-lg bg-foreground text-background outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40">
            <IconStop size={14} />
          </button>
        ) : (
          <button type="submit" aria-label="Send" disabled={!text.trim()} className="grid size-8 place-items-center rounded-lg bg-foreground text-background outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:opacity-30">
            <IconArrowUp size={16} />
          </button>
        )}
      </div>
    </form>
  );
}
