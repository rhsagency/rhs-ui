"use client";

import { useId, useState, type ReactNode } from "react";

import { IconAlertCircle, IconArrowUpRight, IconCheckCircle, IconInfo, IconLock, IconMessage } from "@rhs-ui/icons";
import { Badge } from "@rhs-ui/primitives/badge";
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from "@rhs-ui/primitives/card";
import { Switch } from "@rhs-ui/primitives/switch";
import { cn } from "@/lib/utils";

export type PreviewStage = "alpha" | "beta";

export interface EarlyAccessFeature {
  /** Identity of the feature, handed back to `onToggle`. */
  id: string;
  /** What it is called. */
  name: string;
  /** One line on what it does. */
  description: string;
  /** How far along it is, said in words on a badge: "alpha" is rough and changes often, "beta" is close. */
  stage: PreviewStage;
  /** Whether the person has it on. Controlled: update it in `onToggle`. */
  enabled: boolean;
  /** Where to tell you what they think. */
  feedbackHref?: string;
  /** Where to read more. */
  docsHref?: string;
  /** What changes once it is on, said to the person: "Documents open in the new editor." Shown, with how to undo it, right after they switch it on. */
  effect?: string;
  /** Replaces the default way back: "Switch it off here to go back." */
  undo?: string;
  /** Why the switch is off and locked, in words: "Needs the Team plan". */
  disabledReason?: ReactNode;
}

export interface EarlyAccessFeaturesProps {
  /** The previews on offer. */
  features: readonly EarlyAccessFeature[];
  /**
   * Called when a switch is turned. The switch moves at once; return a promise and it stays busy until it settles,
   * and if it rejects the switch goes back and the row says so.
   */
  onToggle: (id: string, enabled: boolean) => void | Promise<void>;
  /** The line at the foot of the card. Default: previews can change or disappear. */
  note?: ReactNode;
  /** The heading. Default "Early access". */
  title?: string;
  /** The line under the heading. */
  description?: string;
  /** Heading level of the title; 2 for a page section, 3 inside another section. */
  headingLevel?: 2 | 3;
  /** Extra classes for the card. */
  className?: string;
}

type Note = { kind: "on" | "off" } | { kind: "error"; wanted: boolean };

const STAGE: Record<PreviewStage, { word: string; className: string }> = {
  alpha: { word: "Alpha", className: "border-dashed text-muted-foreground" },
  beta: { word: "Beta", className: "text-foreground" },
};

const linkClass = "inline-flex items-center gap-1.5 rounded-md text-xs font-medium text-foreground underline-offset-4 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/40 [&_svg]:size-3.5 [&_svg]:text-muted-foreground";

/**
 * Lets people opt into what is coming without a support email. Each preview
 * is a row with its name, one line on what it does, a badge that says Alpha
 * or Beta in words, a switch, and links to give feedback and to learn more.
 * Turning one on shows, politely announced, what will change and how to undo
 * it; a row that cannot be turned on says why in text ("Needs the Team plan"),
 * and a switch whose request fails goes back with a message. The foot of the
 * card says previews can change or disappear.
 */
export function EarlyAccessFeatures({
  features,
  onToggle,
  note,
  title = "Early access",
  description = "Try what we are building before everyone else. You can switch any of these off again whenever you like.",
  headingLevel = 2,
  className,
}: EarlyAccessFeaturesProps) {
  const id = useId();
  const Heading = headingLevel === 3 ? "h3" : "h2";
  // The value a switch is heading for while its request is on the way.
  const [wanted, setWanted] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState<Record<string, Note>>({});

  const on = features.filter((feature) => feature.enabled).length;

  async function toggle(feature: EarlyAccessFeature, next: boolean) {
    if (feature.id in wanted) return;
    setWanted((current) => ({ ...current, [feature.id]: next }));
    setNotes(({ [feature.id]: _dropped, ...rest }) => rest);
    try {
      await onToggle(feature.id, next);
      setNotes((current) => ({ ...current, [feature.id]: { kind: next ? "on" : "off" } }));
    } catch {
      setNotes((current) => ({ ...current, [feature.id]: { kind: "error", wanted: next } }));
    } finally {
      setWanted(({ [feature.id]: _settled, ...rest }) => rest);
    }
  }

  return (
    <Card data-slot="early-access-features" role="group" aria-labelledby={`${id}-title`} className={cn("gap-0 pb-0", className)}>
      <CardHeader className="pb-6">
        <CardTitle asChild>
          <Heading id={`${id}-title`} className="text-base">
            {title}
          </Heading>
        </CardTitle>
        <CardDescription className="text-pretty">{description}</CardDescription>
        {features.length ? (
          <CardAction>
            <p className="text-sm whitespace-nowrap text-muted-foreground tabular-nums">
              <span className="font-medium text-foreground">{on}</span> of {features.length} on
            </p>
          </CardAction>
        ) : null}
      </CardHeader>

      {features.length ? (
        <ul className="divide-y divide-border border-t border-border">
          {features.map((feature) => {
            const rowId = `${id}-${feature.id}`;
            const checked = wanted[feature.id] ?? feature.enabled;
            const stage = STAGE[feature.stage];
            const current = notes[feature.id];
            const locked = feature.disabledReason !== undefined && feature.disabledReason !== null && feature.disabledReason !== false;
            return (
              <li key={feature.id} className="px-6 py-5">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-6">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                      <p id={`${rowId}-name`} className="text-sm font-medium">
                        {feature.name}
                      </p>
                      <Badge id={`${rowId}-stage`} variant="outline" className={cn("h-[1.125rem] px-1.5 text-[0.6875rem] font-semibold tracking-wide uppercase", stage.className)}>
                        {stage.word}
                      </Badge>
                    </div>
                    <p id={`${rowId}-description`} className="mt-1 text-sm text-pretty text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                  <Switch
                    checked={checked}
                    disabled={locked}
                    aria-labelledby={`${rowId}-name ${rowId}-stage`}
                    aria-describedby={`${rowId}-description${locked ? ` ${rowId}-reason` : ""}`}
                    aria-busy={feature.id in wanted || undefined}
                    onCheckedChange={(next) => void toggle(feature, next)}
                  />
                </div>

                {locked ? (
                  <p id={`${rowId}-reason`} className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <IconLock aria-hidden="true" className="size-3.5 shrink-0" />
                    <span>{feature.disabledReason}</span>
                  </p>
                ) : null}

                {/* The region stays in the page, so a screen reader hears what is put into it. */}
                <div aria-live="polite">
                  {current?.kind === "on" && feature.enabled ? (
                    <div className="mt-3 flex items-start gap-2.5 rounded-lg bg-muted/60 px-3 py-2.5 text-sm motion-safe:animate-rhs-in">
                      <IconCheckCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                      <p className="min-w-0 text-pretty">
                        <span className="font-medium">{feature.name} is on.</span>
                        {feature.effect ? ` ${feature.effect}` : ""} <span className="text-muted-foreground">{feature.undo ?? "Switch it off here to go back."}</span>
                      </p>
                    </div>
                  ) : null}
                  {current?.kind === "off" ? <p className="sr-only">{feature.name} is off.</p> : null}
                </div>
                {current?.kind === "error" ? (
                  <p role="alert" className="mt-3 flex items-center gap-1.5 text-xs font-medium text-destructive">
                    <IconAlertCircle aria-hidden="true" className="size-3.5 shrink-0" />
                    {`Could not turn ${feature.name} ${current.wanted ? "on" : "off"}. Nothing changed, try again.`}
                  </p>
                ) : null}

                {feature.feedbackHref || feature.docsHref ? (
                  <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5">
                    {feature.feedbackHref ? (
                      <a href={feature.feedbackHref} className={linkClass}>
                        <IconMessage aria-hidden="true" />
                        Give feedback
                        <span className="sr-only"> on {feature.name}</span>
                      </a>
                    ) : null}
                    {feature.docsHref ? (
                      <a href={feature.docsHref} className={linkClass}>
                        <IconArrowUpRight aria-hidden="true" />
                        Learn more
                        <span className="sr-only"> about {feature.name}</span>
                      </a>
                    ) : null}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="border-t border-border px-6 py-10 text-center">
          <p className="text-sm font-medium">No previews are open right now</p>
          <p className="mt-1 text-sm text-muted-foreground">New ones will show up here when they are ready to try.</p>
        </div>
      )}

      <div className="flex items-start gap-2.5 rounded-b-xl border-t border-border bg-muted/40 px-6 py-3.5 text-xs text-muted-foreground">
        <IconInfo aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
        <p className="text-pretty">{note ?? "Previews can change or disappear without notice. Switch one off whenever you like."}</p>
      </div>
    </Card>
  );
}
