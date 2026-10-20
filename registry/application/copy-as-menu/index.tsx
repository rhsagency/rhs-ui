"use client";

import { useEffect, useId, useRef, useState, type ComponentProps } from "react";

import { Glyph, IconAlertCircle, IconChevronDown, IconCopy, IconSpinner } from "@rhs-ui/icons";
import { copyText } from "@rhs-ui/application/copy-as-menu/clipboard";
import { Button, type ButtonProps } from "@rhs-ui/primitives/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from "@rhs-ui/primitives/dropdown-menu";
import { cn } from "@/lib/utils";

export interface CopyFormat {
  /** Identity of the format, for `format` and `onFormatChange`. */
  id: string;
  /** What the menu calls it: "Markdown", "JSON", "cURL". */
  label: string;
  /** How it reads after "Copy as" and "Copied as", when that is not the label: "plain text" for "Plain text". */
  as?: string;
  /** One line on what this format produces, shown under the label in the menu. */
  description?: string;
  /** Turns the data into this format. It runs only when someone copies in this format, and may be async. */
  serialize: () => string | Promise<string>;
}

export interface CopyAsMenuProps extends Omit<ComponentProps<"div">, "children" | "onCopy" | "onError"> {
  /** The formats on offer, in menu order. The first one is the default. */
  formats: readonly CopyFormat[];
  /** The current format, controlled. Pair it with `onFormatChange`. */
  format?: string;
  /** The format an uncontrolled menu starts with. Default: the first. */
  defaultFormat?: string;
  /** Called with the id when someone picks a format, so the parent can keep the last choice. */
  onFormatChange?: (id: string) => void;
  /** Called with the format and the text once it is on the clipboard. */
  onCopy?: (format: CopyFormat, text: string) => void;
  /** Called when the text could not be produced or the browser refused to copy it. */
  onError?: (format: CopyFormat, error: unknown) => void;
  /** The height: 32, 36 or 44px. */
  size?: "sm" | "default" | "lg";
  /** The look of both buttons. Default "outline". */
  variant?: Extract<ButtonProps["variant"], "default" | "secondary" | "outline">;
  /** The chevron's accessible name. Default "Choose a format to copy as". */
  menuLabel?: string;
}

type Status = "idle" | "copying" | "copied" | "failed";

const fade = "col-start-1 row-start-1 transition-opacity duration-200 motion-reduce:transition-none";
const draw = "transition-[stroke-dashoffset] duration-300 ease-out motion-reduce:transition-none";
// The old words leave quickly and the new ones arrive just after, so the two are hardly ever on screen together.
const swap = "col-start-1 row-start-1 truncate transition-[opacity,translate] motion-reduce:transition-none";
const arriving = "opacity-100 delay-75 duration-200";
const leaving = "pointer-events-none opacity-0 duration-100";
const DIVIDER = { default: "border-l-primary-foreground/30", secondary: "border-l-foreground/15", outline: "" } as const;
const FAILED_SOLID = "data-[status=failed]:bg-destructive data-[status=failed]:text-destructive-foreground data-[status=failed]:hover:bg-destructive/90";
const FAILED_QUIET = "data-[status=failed]:border-destructive data-[status=failed]:text-destructive data-[status=failed]:hover:text-destructive";

const nameOf = (format: CopyFormat) => format.as ?? format.label;

/**
 * A copy button for data that other tools want in other shapes, like an API
 * response, a console log or a table: Markdown for the README, JSON for the
 * script, cURL for the terminal, CSV for the spreadsheet. The main button
 * copies in the current format and confirms with a check and the format's name
 * ("Copied as cURL"); the chevron opens a menu of formats with one line on what
 * each produces, and picking one copies in it and keeps it as the current
 * format. Formats are made only when asked for, so a large table is turned into
 * CSV only when someone picks CSV. ArrowDown opens the menu, Enter copies, and
 * the result is read out in a live region.
 */
export function CopyAsMenu({ formats, format, defaultFormat, onFormatChange, onCopy, onError, size = "default", variant = "outline", menuLabel = "Choose a format to copy as", className, ...props }: CopyAsMenuProps) {
  const groupId = useId();
  const [own, setOwn] = useState(defaultFormat ?? formats[0]?.id);
  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState<{ align: "start" | "end"; offset: number }>({ align: "end", offset: 0 });
  const group = useRef<HTMLDivElement>(null);
  const chevron = useRef<HTMLButtonElement>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [copied, setCopied] = useState<CopyFormat | null>(null);
  const timer = useRef<number>(undefined);
  const busy = useRef(false);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const currentId = format ?? own;
  const current = formats.find((item) => item.id === currentId) ?? formats[0];
  const empty = !current;
  const reported = copied ?? current;

  async function copy(target: CopyFormat) {
    if (busy.current) return;
    busy.current = true;
    window.clearTimeout(timer.current);
    setCopied(target);
    let source: string | Promise<string>;
    try {
      source = target.serialize();
    } catch (error) {
      fail(target, error);
      return;
    }
    // A text that is ready is copied in this very click; a slow one shows the spinner.
    if (typeof source !== "string") setStatus("copying");
    try {
      const text = await copyText(source);
      setStatus("copied");
      timer.current = window.setTimeout(() => setStatus("idle"), 2000);
      onCopy?.(target, text);
    } catch (error) {
      fail(target, error);
      return;
    }
    busy.current = false;
  }

  function fail(target: CopyFormat, error: unknown) {
    busy.current = false;
    setStatus("failed");
    timer.current = window.setTimeout(() => setStatus("idle"), 3200);
    onError?.(target, error);
  }

  // The menu lines up with the whole control, not just the chevron: its left edge in the left half of the screen, its right edge in the right half.
  function changeOpen(next: boolean) {
    const box = group.current?.getBoundingClientRect();
    const trigger = chevron.current?.getBoundingClientRect();
    if (next && box && trigger) setPlacement(box.left + box.width / 2 > window.innerWidth / 2 ? { align: "end", offset: 0 } : { align: "start", offset: box.left - trigger.left });
    setOpen(next);
  }

  function choose(id: string) {
    const next = formats.find((item) => item.id === id);
    if (!next) return;
    if (format === undefined) setOwn(id);
    onFormatChange?.(id);
    void copy(next);
  }

  const message = !reported ? "" : status === "copied" ? `Copied as ${nameOf(reported)}` : status === "failed" ? `Could not copy as ${nameOf(reported)}` : "";
  const chevronSize = size === "sm" ? "icon-sm" : "icon";
  const joinRight = cn("-ml-px rounded-l-none hover:z-[1] focus-visible:z-10", size === "lg" && "size-11", DIVIDER[variant]);

  return (
    <div data-slot="copy-as-menu" className={cn("inline-flex max-w-full flex-col items-start", className)} {...props}>
      <span role="status" className="sr-only">
        {message}
      </span>
      <div ref={group} role="group" aria-labelledby={groupId} className="inline-flex max-w-full items-stretch">
        <span id={groupId} className="sr-only">
          Copy
        </span>
        <Button
          type="button"
          variant={variant}
          size={size}
          disabled={empty}
          data-status={status}
          aria-busy={status === "copying" || undefined}
          onClick={() => current && void copy(current)}
          onKeyDown={(event) => {
            if (event.key !== "ArrowDown" || empty) return;
            event.preventDefault();
            changeOpen(true);
          }}
          className={cn("min-w-0 shrink rounded-r-none hover:z-[1] focus-visible:z-10", variant === "default" ? FAILED_SOLID : FAILED_QUIET)}
        >
          <span className="relative grid size-4 shrink-0 place-items-center">
            <IconCopy className={cn(fade, status === "idle" ? "opacity-100" : "opacity-0")} />
            <IconSpinner className={cn(fade, status === "copying" ? "opacity-100" : "opacity-0")} />
            <Glyph className={cn(fade, status === "copied" ? "opacity-100" : "opacity-0")}>
              <path d="M5 12.5l4.5 4.5L19 7" pathLength={1} strokeDasharray={1} className={cn(draw, "delay-100", status === "copied" ? "[stroke-dashoffset:0]" : "[stroke-dashoffset:1]")} />
            </Glyph>
            <IconAlertCircle className={cn(fade, status === "failed" ? "opacity-100" : "opacity-0")} />
          </span>
          <span className="inline-grid min-w-0 text-start">
            <span aria-hidden={status === "copied" || status === "failed" || undefined} className={cn(swap, status === "idle" || status === "copying" ? arriving : cn(leaving, "-translate-y-1"))}>
              Copy as {current ? nameOf(current) : "…"}
            </span>
            <span aria-hidden={status !== "copied"} className={cn(swap, status === "copied" ? arriving : cn(leaving, "translate-y-1"))}>
              Copied as {reported ? nameOf(reported) : "…"}
            </span>
            <span aria-hidden={status !== "failed"} className={cn(swap, status === "failed" ? arriving : cn(leaving, "translate-y-1"))}>
              Could not copy
            </span>
          </span>
        </Button>
        <DropdownMenu open={open} onOpenChange={changeOpen}>
          <DropdownMenuTrigger asChild>
            <Button ref={chevron} type="button" variant={variant} size={chevronSize} disabled={empty} aria-label={menuLabel} className={joinRight}>
              <IconChevronDown className="transition-transform duration-200 group-data-[state=open]/button:rotate-180 motion-reduce:transition-none" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={placement.align} alignOffset={placement.offset} collisionPadding={8} className="w-80 max-w-[calc(100vw-2rem)]">
            <DropdownMenuLabel>Copy as</DropdownMenuLabel>
            <DropdownMenuRadioGroup value={current?.id ?? ""} onValueChange={choose}>
              {formats.map((item) => (
                <DropdownMenuRadioItem key={item.id} value={item.id} textValue={item.label} className="items-start py-2">
                  <span className="min-w-0">
                    <span className="block text-sm leading-tight font-medium text-foreground">{item.label}</span>
                    {item.description ? <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{item.description}</span> : null}
                  </span>
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
