"use client";

import { useId, useRef, useState, type ChangeEvent, type ReactNode } from "react";

import { DropOverlay, DropOverlayPanel } from "@rhs-ui/application/drop-overlay";
import { IconClose, IconFile, IconImage, IconPaperclip } from "@rhs-ui/icons";
import { Avatar, AvatarFallback } from "@rhs-ui/primitives/avatar";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { Switch } from "@rhs-ui/primitives/switch";

interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
}

const START: Attachment[] = [
  { id: "crack", name: "desk-leg-crack.jpg", size: 1_840_000, type: "image/jpeg" },
  { id: "note", name: "delivery-note.pdf", size: 214_000, type: "application/pdf" },
];

const ACCEPT = "image/*,.pdf";

/** A size in words: 214 KB, 1.8 MB. */
function sizeOf(bytes: number): string {
  if (bytes < 1_000_000) return `${Math.max(1, Math.round(bytes / 1000))} KB`;
  return `${(bytes / 1_000_000).toFixed(1)} MB`;
}

/** A caption above a case, in the quiet voice the rest of the demo uses. */
function Case({ caption, children }: { caption: ReactNode; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 content-start gap-3">
      <p className="text-xs leading-relaxed text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

/** A region with ghost content under the overlay, so the overlay reads as a layer and not as a card. The ghost stays clear of the message. */
function Mock({ children }: { children: ReactNode }): React.JSX.Element {
  return (
    <div className="relative h-56 overflow-hidden rounded-xl border border-border bg-card">
      <div aria-hidden="true" className="grid gap-3 p-5">
        <div className="h-3 w-2/5 rounded bg-foreground/25" />
        <div className="h-2.5 w-full rounded bg-foreground/20" />
      </div>
      <div aria-hidden="true" className="absolute right-5 bottom-5 h-8 w-24 rounded-md bg-foreground/25" />
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const picker = useRef<HTMLInputElement>(null);
  const windowId = useId();
  const [files, setFiles] = useState<Attachment[]>(START);
  const [left, setLeft] = useState<string | null>(null);
  const [wholeWindow, setWholeWindow] = useState(false);

  function add(list: File[]) {
    setLeft(null);
    setFiles((current) => [...current, ...list.map((file, index) => ({ id: `${file.name}-${file.size}-${current.length + index}`, name: file.name, size: file.size, type: file.type }))]);
  }

  function onPick(event: ChangeEvent<HTMLInputElement>) {
    add(Array.from(event.target.files ?? []));
    // The same file can be chosen again after it was removed.
    event.target.value = "";
  }

  return (
    <div className="mx-auto grid w-full max-w-4xl gap-10 px-4 py-8 @container sm:px-6">
      <Case caption="Drag a file over the ticket. It answers at once with what will happen, and flicker-free as you move over the text and the buttons. Dragged text and links do nothing. Try a .docx or a .zip for the refusal.">
        <div className="grid gap-4">
          <DropOverlay
            accept={ACCEPT}
            message="Drop to attach to this ticket"
            onFiles={add}
            onReject={(refused) => setLeft(`${refused.map((file) => file.name).join(", ")} ${refused.length === 1 ? "was" : "were"} left out: only images and PDFs can be attached.`)}
            global={wholeWindow}
            className="rounded-xl border border-border bg-card shadow-xs"
          >
            <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4">
              <div className="grid gap-1">
                <p className="text-xs text-muted-foreground">NW-4821 · opened 2 November</p>
                <h3 className="text-base font-semibold tracking-[-0.015em]">Refund for order 20841</h3>
              </div>
              <Badge variant="muted">Waiting for you</Badge>
            </header>

            <div className="grid gap-6 px-5 py-5">
              <div className="flex items-start gap-3">
                <Avatar size="sm" aria-hidden="true">
                  <AvatarFallback>MO</AvatarFallback>
                </Avatar>
                <div className="grid min-w-0 gap-1">
                  <p className="text-sm font-medium">
                    Mara Okafor <span className="text-xs font-normal text-muted-foreground">9:14</span>
                  </p>
                  <p className="text-sm leading-relaxed text-muted-foreground">The walnut desk arrived with a cracked leg. The photos are below, and the delivery note too. Could you send a replacement, or refund it?</p>
                </div>
              </div>

              <div className="grid gap-2">
                <p className="text-xs font-medium text-muted-foreground">Attachments · {files.length}</p>
                {files.length > 0 ? (
                  <ul className="grid gap-2" aria-label="Attachments">
                    {files.map((file) => (
                      <li key={file.id} className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2 text-sm">
                        {file.type.startsWith("image/") ? <IconImage aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" /> : <IconFile aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />}
                        <span className="min-w-0 flex-1 truncate">{file.name}</span>
                        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{sizeOf(file.size)}</span>
                        <button
                          type="button"
                          aria-label={`Remove ${file.name}`}
                          onClick={() => setFiles((current) => current.filter((item) => item.id !== file.id))}
                          className="grid size-6 shrink-0 place-items-center rounded text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40"
                        >
                          <IconClose className="size-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-sm text-muted-foreground">Nothing attached yet.</p>
                )}
                <p role="status" className="text-xs leading-5 text-destructive empty:sr-only">
                  {left}
                </p>
              </div>
            </div>

            <footer className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-b-[inherit] border-t border-border bg-muted/30 px-5 py-3.5">
              <Button type="button" variant="outline" size="sm" onClick={() => picker.current?.click()}>
                <IconPaperclip />
                Attach files
              </Button>
              <input ref={picker} type="file" multiple accept={ACCEPT} tabIndex={-1} aria-hidden="true" className="sr-only" onChange={onPick} />
              <p className="text-xs text-muted-foreground">Or drop them anywhere on this ticket. Images and PDFs.</p>
            </footer>
          </DropOverlay>

          <div className="flex items-center gap-3">
            <Switch id={windowId} checked={wholeWindow} onCheckedChange={setWholeWindow} />
            <label htmlFor={windowId} className="text-sm">
              Take a drop anywhere on the page
              <span className="block text-xs text-muted-foreground">The overlay then covers the whole window.</span>
            </label>
          </div>
        </div>
      </Case>

      <div className="grid gap-8 @2xl:grid-cols-2">
        <Case caption="While files are over the region: what will happen, how many files and what is welcome.">
          <Mock>
            <DropOverlayPanel state="accept" message="Drop to attach to this ticket" detail="2 files · images or PDF" />
          </Mock>
        </Case>
        <Case caption="When the dragged types cannot match, it says so and the drop is not allowed.">
          <Mock>
            <DropOverlayPanel state="reject" message="These files can't be uploaded" detail="Only images or PDF" />
          </Mock>
        </Case>
      </div>
    </div>
  );
}
