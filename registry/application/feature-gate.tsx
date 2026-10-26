"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type FocusEvent, type MouseEvent, type ReactNode } from "react";

import { IconLock } from "@rhs-ui/icons";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

/** The one thing the panel asks for. */
export interface FeatureGateAction {
  /** What the button says: "Upgrade to Scale". Say what happens, not "Click here". */
  label: string;
  /** Runs when it is pressed. With `href` it runs on the link and receives the event, so a client-side router can call `preventDefault()`. */
  onClick?: (event: MouseEvent<HTMLElement>) => void;
  /** Makes it a link, for a pricing page or a billing screen. */
  href?: string;
}

/** The words the gate uses, for translation. `{plan}` and `{title}` are filled in. */
export interface FeatureGateLabels {
  /** The badge beside the lock. Default "{plan} plan". */
  plan?: string;
  /** Said when the feature unlocks. Default "{title} is now available." */
  unlocked?: string;
}

export interface FeatureGateProps extends Omit<ComponentProps<"div">, "title"> {
  /** Whether the visitor's plan leaves the feature out. Unlocked, the children render untouched. Default true. */
  locked?: boolean;
  /** The plan that includes it: "Scale". Shown as "Scale plan" in a badge. */
  plan?: string;
  /** What is locked, as the panel's heading: "Audit log". */
  title: string;
  /** What they get, in a sentence or two. Say the benefit, not the lack. */
  description?: string;
  /** The one action: a button, or a link when it has an `href`. */
  action?: FeatureGateAction;
  /** The real feature. While locked it stays in view, muted, with nothing in it reachable. */
  children?: ReactNode;
  /** Heading level of the panel's title. Default 3. */
  headingLevel?: 2 | 3 | 4;
  /** The words the gate uses, for translation. */
  labels?: FeatureGateLabels;
}

const fill = (template: string, values: Record<string, string>) => template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

/**
 * Wraps a feature the visitor's plan does not include. The real content stays
 * where it is, muted and inert, so people see what they would get; a solid
 * panel on top names the plan, says the benefit and offers one action. While
 * locked the content is inert and hidden from assistive technology, so nobody
 * tabs into controls that do nothing, and the panel is a labelled region.
 * Unlocked, the children are rendered as they are and keep their state. The
 * panel reads the gate's own width: a stacked card in a narrow gate, and from
 * 36rem a single-row bar (lock, words, action), so a short feature still shows
 * behind it. Quiet by design: a border and a lock, no blur and no gradient.
 * If the panel's own button had focus when the feature unlocks, focus moves to
 * the gate instead of falling to the top of the page, and the unlock is
 * announced.
 */
export function FeatureGate({ locked = true, plan, title, description, action, children, headingLevel = 3, labels, className, ...props }: FeatureGateProps) {
  const text = { plan: "{plan} plan", unlocked: "{title} is now available.", ...labels };
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";
  const titleId = useId();
  const descriptionId = useId();
  const root = useRef<HTMLDivElement>(null);
  const held = useRef(false);
  const was = useRef(locked);
  const [notice, setNotice] = useState("");

  // When the panel goes, the button that had focus goes with it: focus moves to the gate, and the change is said.
  useEffect(() => {
    const wasLocked = was.current;
    was.current = locked;
    if (!wasLocked || locked) return;
    setNotice(fill(text.unlocked, { title }));
    if (held.current) root.current?.focus({ preventScroll: true });
    held.current = false;
    const timer = window.setTimeout(() => setNotice(""), 4000);
    return () => window.clearTimeout(timer);
  }, [locked]);

  const trackFocus = (event: FocusEvent<HTMLElement>) => {
    held.current = event.type === "focus" || event.currentTarget.contains(event.relatedTarget as Node | null);
  };

  return (
    <div ref={root} tabIndex={-1} data-slot="feature-gate" data-locked={locked ? "" : undefined} className={cn("@container relative grid outline-none", className)} {...props}>
      <div
        data-slot="feature-gate-content"
        inert={locked || undefined}
        aria-hidden={locked || undefined}
        className={cn("col-start-1 row-start-1 min-w-0 self-center transition-opacity duration-200 motion-reduce:transition-none", locked && "pointer-events-none opacity-45 select-none")}
      >
        {children}
      </div>

      {locked ? (
        <div className="relative z-10 col-start-1 row-start-1 grid place-items-center p-4 @sm:p-6">
          {/* A narrow gate gets a stacked card. From 36rem the card lies down into a bar (the lock, the words and the action in one row), so the content behind it stays in view. */}
          <section
            data-slot="feature-gate-panel"
            aria-labelledby={titleId}
            aria-describedby={description ? descriptionId : undefined}
            onFocus={trackFocus}
            onBlur={trackFocus}
            className="grid w-full max-w-sm justify-items-center gap-3 rounded-xl border border-border bg-card p-6 text-center text-card-foreground shadow-sm @xl:max-w-2xl @xl:grid-cols-[auto_minmax(0,1fr)_auto] @xl:items-center @xl:justify-items-start @xl:gap-x-4 @xl:gap-y-0 @xl:px-5 @xl:py-4 @xl:text-start"
          >
            <span aria-hidden="true" className="grid size-10 place-items-center rounded-full border border-border bg-muted text-foreground">
              <IconLock className="size-[1.125rem]" />
            </span>
            <div className="grid min-w-0 justify-items-center gap-1.5 @xl:justify-items-start @xl:gap-1">
              {/* The plan sits above the title in the card and in a bar under 42rem; in a wider bar it moves after the title, on the same line. */}
              <div className="flex min-w-0 flex-col items-center gap-1.5 @xl:items-start @2xl:flex-row @2xl:items-center @2xl:gap-2">
                {plan ? (
                  <Badge variant="outline" className="text-muted-foreground @2xl:order-2">
                    {fill(text.plan, { plan })}
                  </Badge>
                ) : null}
                <Heading id={titleId} className="min-w-0 text-base leading-snug font-semibold tracking-[-0.02em] text-balance">
                  {title}
                </Heading>
              </div>
              {description ? (
                <p id={descriptionId} className="text-sm leading-relaxed text-pretty text-muted-foreground">
                  {description}
                </p>
              ) : null}
            </div>
            {action ? (
              action.href ? (
                <Button asChild className="mt-1 @xl:mt-0">
                  <a href={action.href} onClick={action.onClick}>
                    {action.label}
                  </a>
                </Button>
              ) : (
                <Button type="button" className="mt-1 @xl:mt-0" onClick={action.onClick}>
                  {action.label}
                </Button>
              )
            ) : null}
          </section>
        </div>
      ) : null}
      <p role="status" className="sr-only">
        {notice}
      </p>
    </div>
  );
}
