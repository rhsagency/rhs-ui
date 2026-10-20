"use client";

import { useState, type ReactNode } from "react";

import { BulkSelectMenu, type BulkSelectState } from "@rhs-ui/application/bulk-select-menu";
import { IconArchive, IconPaperclip, IconStar, IconTrash } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { Checkbox } from "@rhs-ui/primitives/checkbox";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  from: string;
  subject: string;
  preview: string;
  time: string;
  unread: boolean;
  starred: boolean;
  attachment: boolean;
}

const MESSAGES: Message[] = [
  { id: "m1", from: "Priya Nair", subject: "Invoice INV-2041 is ready", preview: "Attached is the October invoice for Northwind Studio, due on the 28th.", time: "9:42 AM", unread: true, starred: false, attachment: true },
  { id: "m2", from: "Halcyon Billing", subject: "Your receipt from Halcyon", preview: "Thanks for your payment of EUR 249.00. Your receipt is attached.", time: "9:15 AM", unread: true, starred: true, attachment: true },
  { id: "m3", from: "Tomas Berg", subject: "Re: Kestrel launch checklist", preview: "Looks good to me. One thing left: the status page copy still needs a pass.", time: "8:58 AM", unread: false, starred: true, attachment: false },
  { id: "m4", from: "Design weekly", subject: "Five patterns for calmer settings pages", preview: "This week: progressive disclosure, honest defaults and fewer toggles.", time: "Yesterday", unread: true, starred: false, attachment: false },
  { id: "m5", from: "Amara Osei", subject: "Brand guidelines v3", preview: "I have updated the logo clear space and the dark mode palette, see the PDF.", time: "Yesterday", unread: false, starred: false, attachment: true },
  { id: "m6", from: "Northwind Support", subject: "Your ticket #4821 was resolved", preview: "We fixed the export timeout. Let us know if it happens again.", time: "Mon", unread: false, starred: false, attachment: false },
  { id: "m7", from: "Jonas Lind", subject: "Lunch on Thursday?", preview: "There is a new place near the canal that does a very good lentil soup.", time: "Mon", unread: true, starred: false, attachment: false },
  { id: "m8", from: "Calendar", subject: "Reminder: planning starts in 15 minutes", preview: "Q4 planning with Mara, Theo and Ines in Room Heron.", time: "Mon", unread: false, starred: false, attachment: false },
];

const STATES: { state: BulkSelectState; selected: number; caption: string }[] = [
  { state: "none", selected: 0, caption: "Nothing selected" },
  { state: "some", selected: 12, caption: "Some selected: the dash" },
  { state: "all", selected: 248, caption: "Everything selected" },
];

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start justify-items-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const state: BulkSelectState = selected.size === 0 ? "none" : selected.size === MESSAGES.length ? "all" : "some";
  const pick = (test: (message: Message) => boolean) => setSelected(new Set(MESSAGES.filter(test).map((message) => message.id)));
  const count = (test: (message: Message) => boolean) => MESSAGES.filter(test).length;

  return (
    <div className="grid w-full max-w-2xl gap-9">
      <Example caption="The select-all control of an inbox. Try the chevron: each choice says how many rows it picks.">
        <div className="w-full overflow-hidden rounded-xl border border-border bg-card shadow-xs">
          <div className="flex min-h-14 items-center justify-between gap-3 border-b border-border px-3 py-2.5 sm:px-4">
            <BulkSelectMenu
              state={state}
              total={MESSAGES.length}
              selectedCount={selected.size}
              onSelectAll={() => setSelected(new Set(MESSAGES.map((message) => message.id)))}
              onSelectNone={() => setSelected(new Set())}
              criteria={[
                { id: "unread", label: "Unread", count: count((message) => message.unread), onSelect: () => pick((message) => message.unread) },
                { id: "starred", label: "Starred", count: count((message) => message.starred), onSelect: () => pick((message) => message.starred) },
                { id: "attachments", label: "With attachments", count: count((message) => message.attachment), onSelect: () => pick((message) => message.attachment) },
              ]}
            />
            {selected.size ? (
              <div className="flex items-center gap-1">
                <Button type="button" variant="ghost" size="icon-sm" aria-label={`Archive ${selected.size} selected`} onClick={() => setSelected(new Set())}>
                  <IconArchive />
                </Button>
                <Button type="button" variant="ghost" size="icon-sm" aria-label={`Delete ${selected.size} selected`} onClick={() => setSelected(new Set())}>
                  <IconTrash />
                </Button>
              </div>
            ) : null}
          </div>
          <ul className="divide-y divide-border">
            {MESSAGES.map((message) => {
              // The select-all control above has a border of its own, which insets its checkbox by 10px: the rows start 10px further in, so both checkbox columns line up.
              const checked = selected.has(message.id);
              return (
                <li key={message.id} className={cn("flex items-center gap-3 py-3 pr-3 pl-[22px] transition-colors duration-150 sm:pr-4 sm:pl-[26px]", checked && "bg-muted/60")}>
                  <Checkbox
                    checked={checked}
                    aria-label={`Select the message from ${message.from}`}
                    onCheckedChange={(next) =>
                      setSelected((current) => {
                        const copy = new Set(current);
                        if (next === true) copy.add(message.id);
                        else copy.delete(message.id);
                        return copy;
                      })
                    }
                  />
                  <IconStar aria-hidden="true" className={cn("size-4 shrink-0", message.starred ? "fill-foreground text-foreground" : "text-muted-foreground/50")} />
                  <div className="min-w-0 flex-1 sm:flex sm:items-baseline sm:gap-3">
                    <p className={cn("truncate text-sm sm:w-36 sm:shrink-0", message.unread ? "font-semibold" : "font-normal text-muted-foreground")}>{message.from}</p>
                    <p className="truncate text-sm">
                      <span className={message.unread ? "font-medium" : "text-muted-foreground"}>{message.subject}</span>
                      <span className="hidden pl-2 text-muted-foreground sm:inline">{message.preview}</span>
                    </p>
                  </div>
                  {message.attachment ? <IconPaperclip title="Has an attachment" className="size-3.5 shrink-0 text-muted-foreground" /> : null}
                  <span className="w-16 shrink-0 text-right text-xs text-muted-foreground tabular-nums">{message.time}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </Example>

      <Example caption="The three states of the checkbox, beside the count in words">
        <div className="flex flex-wrap items-start gap-x-10 gap-y-6">
          {STATES.map(({ state: value, selected: picked, caption }) => (
            <div key={value} className="grid justify-items-start gap-2.5">
              <BulkSelectMenu state={value} total={248} selectedCount={picked} onSelectAll={() => undefined} onSelectNone={() => undefined} criteria={[{ id: "unread", label: "Unread", count: 12, onSelect: () => undefined }]} />
              <span className="text-xs text-muted-foreground">{caption}</span>
            </div>
          ))}
        </div>
      </Example>
    </div>
  );
}
