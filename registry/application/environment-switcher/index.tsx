"use client";

import { useId, useRef, useState, type ComponentProps } from "react";
import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui";

import { IconArrowRight, IconCheck, IconChevronsUpDown } from "@rhs-ui/icons";
import {
  consequenceOf,
  DEFAULT_LABELS,
  fill,
  isLive,
  type Environment,
  type EnvironmentKind,
  type EnvironmentSwitcherLabels,
} from "@rhs-ui/application/environment-switcher/environments";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@rhs-ui/primitives/alert-dialog";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuTrigger } from "@rhs-ui/primitives/dropdown-menu";
import { cn } from "@/lib/utils";

export type { Environment, EnvironmentKind, EnvironmentSwitcherLabels } from "@rhs-ui/application/environment-switcher/environments";

export interface EnvironmentSwitcherProps extends Omit<ComponentProps<"div">, "children" | "onChange" | "defaultValue"> {
  /** The environments the tool can run against, in the order they are listed. */
  environments: readonly Environment[];
  /** The `id` of the environment in use. Controlled: pair it with `onValueChange`. */
  value?: string;
  /** The environment in use at the start, when you do not control it. Default the first. */
  defaultValue?: string;
  /** The person chose another environment, and confirmed it where that is asked. It receives the `id`. */
  onValueChange?: (id: string) => void;
  /** The kinds that ask for confirmation before moving to them. Default `["production"]`. Moving to any other kind is immediate. */
  confirmKinds?: readonly EnvironmentKind[];
  /** Turns the button off, for a moment when the environment cannot be changed. */
  disabled?: boolean;
  /** Which edge of the button the list lines up with. Default "start". */
  align?: "start" | "end";
  /** The words the switcher says, for translation. */
  labels?: EnvironmentSwitcherLabels;
}

/**
 * The mark of an environment, on a 16 unit grid: an open ring for development,
 * a dashed ring for a preview, a ring half filled for staging and a solid disc
 * for production. The shapes differ, so they read without colour.
 */
function Mark({ kind, className }: { kind: EnvironmentKind; className?: string }) {
  return (
    <svg data-slot="environment-switcher-mark" data-kind={kind} viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false" className={cn("size-4 shrink-0", className)}>
      {kind === "development" ? <circle cx="8" cy="8" r="5.75" stroke="currentColor" strokeWidth="1.75" /> : null}
      {kind === "preview" ? <circle cx="8" cy="8" r="5.75" stroke="currentColor" strokeWidth="1.75" strokeDasharray="2.6 2.4" /> : null}
      {kind === "staging" ? (
        <>
          <circle cx="8" cy="8" r="5.75" stroke="currentColor" strokeWidth="1.75" />
          <path d="M8 2.25a5.75 5.75 0 0 0 0 11.5z" fill="currentColor" />
        </>
      ) : null}
      {kind === "production" ? <circle cx="8" cy="8" r="6.5" fill="currentColor" /> : null}
    </svg>
  );
}

/** The inverted label that production wears: dark on a light page and light on a dark one, with the word on it. */
function LiveBadge({ children, className }: { children: string; className?: string }) {
  return (
    <Badge data-slot="environment-switcher-live" className={cn("h-[1.125rem] rounded-[5px] px-1.5 text-[0.6875rem] leading-none font-semibold tracking-[0.04em] uppercase", className)}>
      {children}
    </Badge>
  );
}

/**
 * A menu button for a tool that runs against more than one environment:
 * Development, Staging, Production. The button shows the one in use, its name
 * beside a small mark, and the list gives every environment's name, a line
 * about it and a check on the current one. Production is drawn as live, with a
 * solid mark and an inverted label that says "Live", never by colour alone, and
 * moving to it (or to any kind in `confirmKinds`) opens an alert dialog that
 * names the environment and what changes, with Cancel as the answer focus
 * starts on. Choosing the one already in use does nothing; closing the dialog
 * puts focus back on the button.
 */
export function EnvironmentSwitcher({ environments, value, defaultValue, onValueChange, confirmKinds = ["production"], disabled = false, align = "start", labels, className, ...props }: EnvironmentSwitcherProps) {
  const text: Required<EnvironmentSwitcherLabels> = { ...DEFAULT_LABELS, ...labels };
  const [own, setOwn] = useState(defaultValue ?? environments[0]?.id);
  const [open, setOpen] = useState(false);
  // The environment the dialog asks about stays in state after it is answered, so the dialog keeps its words while it fades out.
  const [asked, setAsked] = useState<Environment | null>(null);
  const [asking, setAsking] = useState(false);
  // Set at once, before the menu has closed, so its focus return knows the dialog is about to open.
  const handingOver = useRef(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const base = useId();

  const chosen = value === undefined ? own : value;
  const current = environments.find((environment) => environment.id === chosen) ?? environments[0];
  if (!current) return null;

  function commit(id: string) {
    if (value === undefined) setOwn(id);
    onValueChange?.(id);
  }

  function request(id: string) {
    const next = environments.find((environment) => environment.id === id);
    if (!next || next.id === current?.id) return;
    if (confirmKinds.includes(next.kind)) {
      handingOver.current = true;
      setAsked(next);
      setAsking(true);
      return;
    }
    commit(next.id);
  }

  return (
    <div data-slot="environment-switcher" className={cn("inline-flex max-w-full min-w-0", className)} {...props}>
      <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
        <DropdownMenuTrigger asChild>
          <Button ref={trigger} type="button" variant="outline" disabled={disabled} data-environment={current.kind} className="max-w-full min-w-0 justify-between gap-2.5 px-3">
            <Mark kind={current.kind} />
            <span className="sr-only">{text.buttonPrefix} </span>
            <span className="truncate">{current.name}</span>
            {isLive(current) ? <LiveBadge>{text.live}</LiveBadge> : null}
            <IconChevronsUpDown aria-hidden="true" className="-me-0.5 ms-0.5 size-4 shrink-0 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align={align}
          className="w-[min(21rem,calc(100vw-2rem))] p-1.5"
          onCloseAutoFocus={(event) => {
            // The dialog is taking focus: do not pull it back to the button for a moment, only to lose it again.
            if (handingOver.current) {
              handingOver.current = false;
              event.preventDefault();
            }
          }}
        >
          <DropdownMenuLabel className="px-2.5 pt-1.5 pb-1.5">{text.heading}</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={current.id} onValueChange={request}>
            {environments.map((environment, index) => (
              // The name of an item is its name and its mark of liveness; the line about it is its description, said after.
              <DropdownMenuPrimitive.RadioItem
                key={environment.id}
                value={environment.id}
                data-kind={environment.kind}
                aria-labelledby={`${base}-${index}-name`}
                aria-describedby={environment.description ? `${base}-${index}-description` : undefined}
                className={cn(
                  "relative flex cursor-default items-start gap-3 rounded-md px-2.5 py-2 text-sm outline-none select-none",
                  "data-[highlighted]:bg-muted data-[highlighted]:text-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                )}
              >
                <Mark kind={environment.kind} className="mt-0.5" />
                <span className="grid min-w-0 flex-1 gap-0.5">
                  <span id={`${base}-${index}-name`} className="flex min-w-0 items-center gap-2">
                    <span className={cn("truncate leading-5", environment.id === current.id ? "font-semibold" : "font-medium")}>{environment.name}</span>
                    {isLive(environment) ? <LiveBadge>{text.live}</LiveBadge> : null}
                  </span>
                  {environment.description ? (
                    <span id={`${base}-${index}-description`} className="text-xs leading-4 text-pretty text-muted-foreground">
                      {environment.description}
                    </span>
                  ) : null}
                </span>
                <span className="mt-0.5 grid size-4 shrink-0 place-items-center">
                  <DropdownMenuPrimitive.ItemIndicator>
                    <IconCheck aria-hidden="true" strokeWidth={2.25} className="size-4" />
                  </DropdownMenuPrimitive.ItemIndicator>
                </span>
              </DropdownMenuPrimitive.RadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog
        open={asking}
        onOpenChange={setAsking}
      >
        <AlertDialogContent
          onCloseAutoFocus={(event) => {
            // There is no trigger of the dialog's own: focus goes back to the button that opened the menu.
            event.preventDefault();
            trigger.current?.focus();
          }}
        >
          {asked ? (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>{fill(text.confirmTitle, { name: asked.name })}</AlertDialogTitle>
                <AlertDialogDescription>
                  {fill(text.confirmMove, { from: current.name, name: asked.name })} {consequenceOf(asked, text)}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 px-3.5 py-3 text-sm" aria-hidden="true">
                <span className="flex min-w-0 items-center gap-2 text-muted-foreground">
                  <Mark kind={current.kind} />
                  <span className="truncate">{current.name}</span>
                </span>
                <IconArrowRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
                <span className="flex min-w-0 items-center gap-2 font-semibold">
                  <Mark kind={asked.kind} />
                  <span className="truncate">{asked.name}</span>
                  {isLive(asked) ? <LiveBadge>{text.live}</LiveBadge> : null}
                </span>
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel>{text.cancel}</AlertDialogCancel>
                <AlertDialogAction onClick={() => commit(asked.id)}>{fill(text.confirm, { name: asked.name })}</AlertDialogAction>
              </AlertDialogFooter>
            </>
          ) : null}
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
