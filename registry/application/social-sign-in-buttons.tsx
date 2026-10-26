"use client";

import { useState, type ComponentProps, type ReactNode } from "react";

import { IconAlertCircle } from "@rhs-ui/icons";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { LabeledDivider } from "@rhs-ui/primitives/labeled-divider";
import { Spinner } from "@rhs-ui/primitives/spinner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@rhs-ui/primitives/tooltip";
import { cn } from "@/lib/utils";

export interface SignInProvider {
  /** Identity: handed to `onSelect`, matched by `lastUsed` and `busy`. */
  id: string;
  /** The provider's name: "Google". The button says "Continue with Google". */
  label: string;
  /** Your own mark, drawn about 20px. Without it the button gets a neutral monogram tile, so no trademarked logo ships. */
  mark?: ReactNode;
}

export interface SocialSignInButtonsProps extends Omit<ComponentProps<"div">, "children" | "onSelect"> {
  /** The providers, in order. */
  providers: readonly SignInProvider[];
  /** Called with the provider's id. The button shows a spinner while it runs and the others disable; a rejection says so under the list. */
  onSelect?: (id: string) => void | Promise<void>;
  /** The provider this person used last. It moves first and gets a quiet "Last used" tag. */
  lastUsed?: string;
  /** One button per row, two per row with short labels, or square buttons with a tooltip. Default "stacked". */
  layout?: "stacked" | "grid" | "icons";
  /** The words before the provider's name, in the accessible name and in the stacked layout. Default "Continue with". */
  labelPrefix?: string;
  /** The id of the provider that is working. Pass it to control the busy state yourself, for example during a redirect; leave it out and the buttons follow the promise `onSelect` returns. */
  busy?: string | null;
  /** The accessible name of the list: a screen reader hears "Sign-in options, 3 items". Default "Sign-in options". */
  label?: string;
  /** A line to draw under the buttons, like "or continue with email". It is a labelled divider, so only the words are read. */
  divider?: ReactNode;
  /** Button height: 32, 36 or 44px. Default "lg", the touch size. */
  size?: "sm" | "default" | "lg";
  /** Disables every button. */
  disabled?: boolean;
}

// The track is `minmax(0, 1fr)`, not `auto`: a long name then shortens to fit instead of widening the list past its card.
const LIST = {
  stacked: "grid grid-cols-[minmax(0,1fr)] gap-2.5",
  grid: "grid grid-cols-2 gap-x-2.5 gap-y-3 [&>li:last-child:nth-child(odd)]:col-span-2",
  icons: "flex flex-wrap gap-2.5",
} as const;
const SQUARE = { sm: "size-8", default: "size-9", lg: "size-11" } as const;
// In a narrow row the large button's text steps down to the size of the default one (14px), which is what lets "Continue with GitHub" fit next to its mark.
const NARROW = { sm: "", default: "", lg: "@max-[17rem]:text-sm" } as const;

/**
 * The letters on each neutral tile, from the words of the name (GitHub is GH, GitLab is GL, LinkedIn is LI) or its
 * first letter (Google is G). When two providers would get the same tile, both take one more letter until each is
 * unique (Google and Gmail become Go and Gm), so icons that stand alone never look alike.
 */
function monograms(providers: readonly SignInProvider[]): Map<string, string> {
  const candidates = (label: string): string[] => {
    // "GitHub" is cut into "Git" and "Hub" at the capital letter inside it.
    const words = label.replace(/([a-z0-9])([A-Z])/g, "$1 $2").split(/[\s._-]+/).filter(Boolean);
    const flat = words.join("");
    const shout = flat === flat.toUpperCase();
    const written = (text: string) => (shout ? text.toUpperCase() : text.charAt(0).toUpperCase() + text.slice(1).toLowerCase());
    const tiles: string[] = [];
    if (words.length > 1) tiles.push(words.slice(0, 2).map((word) => [...word][0]).join("").toUpperCase());
    for (let length = 1; length <= 3; length += 1) tiles.push(written([...flat].slice(0, length).join("") || "?"));
    return tiles;
  };
  const options = providers.map((provider) => candidates(provider.label));
  const level = providers.map(() => 0);
  const pick = (index: number) => options[index]![Math.min(level[index]!, options[index]!.length - 1)]!;
  for (let round = 0; round < 4; round += 1) {
    const holders = new Map<string, number[]>();
    providers.forEach((_, index) => holders.set(pick(index), [...(holders.get(pick(index)) ?? []), index]));
    const clashes = [...holders.values()].filter((group) => group.length > 1);
    if (!clashes.length) break;
    for (const group of clashes) for (const index of group) level[index] = level[index]! + 1;
  }
  return new Map(providers.map((provider, index) => [provider.id, pick(index)]));
}

function Mark({ provider, letters, working, bare = false }: { provider: SignInProvider; letters: string; working: boolean; bare?: boolean }) {
  if (working) return <Spinner size={18} label="" role="presentation" aria-hidden="true" className="block" />;
  if (provider.mark) return <span aria-hidden="true" className="grid size-6 shrink-0 place-items-center [&_svg]:size-5">{provider.mark}</span>;
  // A neutral tile with the first letter: the same shape for every provider, and nobody's logo.
  return (
    <span aria-hidden="true" className={cn("grid size-6 shrink-0 place-items-center rounded-md bg-muted/60 text-xs leading-none font-semibold text-foreground", bare ? "bg-muted" : "border border-border")}>
      {letters}
    </span>
  );
}

/**
 * Continue-with buttons for the top of a sign-in or sign-up form. The marks are
 * neutral monogram tiles drawn in the house style, so no trademarked logo
 * ships, and each provider can bring its own `mark`. While one provider works
 * its button shows a spinner and the others disable; `lastUsed` moves that
 * provider first and adds a quiet "Last used" tag. The icon layout keeps each
 * button's full name for assistive technology and adds a tooltip, and the
 * group is a labelled list, so a screen reader hears "Sign-in options, 3
 * items". It starts nothing itself: `onSelect` gets the provider's id.
 */
export function SocialSignInButtons({
  providers,
  onSelect,
  lastUsed,
  layout = "stacked",
  labelPrefix = "Continue with",
  busy,
  label = "Sign-in options",
  divider,
  size = "lg",
  disabled = false,
  className,
  ...props
}: SocialSignInButtonsProps) {
  const [working, setWorking] = useState<string | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");

  const active = busy !== undefined ? busy : working;
  const letters = monograms(providers);
  const ordered = lastUsed ? [...providers].sort((a, b) => Number(b.id === lastUsed) - Number(a.id === lastUsed)) : providers;
  const last = lastUsed ? providers.find((provider) => provider.id === lastUsed) : undefined;
  const nameOf = (provider: SignInProvider) => [labelPrefix, provider.label].filter(Boolean).join(" ");

  async function choose(provider: SignInProvider): Promise<void> {
    if (active || disabled) return;
    setFailed(null);
    setWorking(provider.id);
    setAnnouncement(`Continuing with ${provider.label}.`);
    try {
      await onSelect?.(provider.id);
    } catch {
      setFailed(provider.label);
      setAnnouncement("");
    } finally {
      setWorking(null);
    }
  }

  const item = (provider: SignInProvider) => {
    const isWorking = active === provider.id;
    const isLast = provider.id === lastUsed;
    const accessibleName = `${nameOf(provider)}${isLast ? ", last used" : ""}`;
    const shared = {
      type: "button" as const,
      variant: "outline" as const,
      "aria-label": accessibleName,
      "aria-busy": isWorking || undefined,
      // The one that works keeps its focus and its full strength; the others step back.
      "aria-disabled": isWorking || undefined,
      disabled: disabled || (active !== null && !isWorking),
      onClick: () => void choose(provider),
    };

    if (layout === "icons") {
      return (
        <li key={provider.id} className="relative min-w-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button {...shared} size="icon" className={cn(SQUARE[size], isWorking && "disabled:opacity-100")}>
                <Mark provider={provider} letters={letters.get(provider.id) ?? "?"} working={isWorking} bare />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{accessibleName}</TooltipContent>
          </Tooltip>
          {isLast ? <span aria-hidden="true" className="pointer-events-none absolute -top-0.5 -right-0.5 size-2.5 rounded-full border-2 border-background bg-foreground" /> : null}
        </li>
      );
    }

    // The tag sits on the button's top edge, so it never takes room from the name, whatever the width.
    const tag = isLast ? (
      <Badge aria-hidden="true" variant="outline" className="pointer-events-none absolute -top-[9px] right-3 z-10 h-[18px] bg-background px-1.5 text-[0.6875rem] leading-none text-muted-foreground">
        Last used
      </Badge>
    ) : null;

    if (layout === "grid") {
      return (
        <li key={provider.id} className="@container relative min-w-0">
          <Button {...shared} size={size} className="w-full justify-start gap-2.5 px-3 @max-[9rem]:gap-2 @max-[9rem]:px-2.5">
            <Mark provider={provider} letters={letters.get(provider.id) ?? "?"} working={isWorking} />
            <span aria-hidden="true" className="min-w-0 truncate">
              {provider.label}
            </span>
          </Button>
          {tag}
        </li>
      );
    }

    // The name is centred between two equal margins that keep clear of the mark. Where the row is narrow, that centring would cut
    // the name short, so it moves up against the mark and the margin on the far side shrinks instead.
    return (
      <li key={provider.id} className="@container relative min-w-0">
        <Button {...shared} size={size} className={cn("relative w-full justify-center px-12 @max-[17rem]:justify-start @max-[17rem]:pr-2.5 @max-[17rem]:pl-11", NARROW[size])}>
          <span className="absolute top-1/2 left-3 flex -translate-y-1/2">
            <Mark provider={provider} letters={letters.get(provider.id) ?? "?"} working={isWorking} />
          </span>
          <span aria-hidden="true" className="min-w-0 truncate">
            {nameOf(provider)}
          </span>
        </Button>
        {tag}
      </li>
    );
  };

  return (
    <div data-slot="social-sign-in-buttons" data-layout={layout} className={cn("grid w-full grid-cols-[minmax(0,1fr)] gap-4", className)} {...props}>
      <span role="status" className="sr-only">
        {announcement}
      </span>
      <TooltipProvider>
        <ul role="list" aria-label={label} className={cn("m-0 list-none p-0", LIST[layout])}>
          {ordered.map(item)}
        </ul>
      </TooltipProvider>
      {/* Square buttons have no room for a tag, so the dot on one of them is explained here (the buttons' names already say "last used"). */}
      {layout === "icons" && last ? (
        <p aria-hidden="true" className="-mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="size-2 shrink-0 rounded-full bg-foreground" />
          Last used: {last.label}
        </p>
      ) : null}
      {failed ? (
        <p role="alert" className="flex items-start gap-1.5 text-xs leading-snug font-medium text-destructive">
          <IconAlertCircle className="mt-px size-3.5 shrink-0" />
          Could not continue with {failed}. Try again.
        </p>
      ) : null}
      {divider ? <LabeledDivider className="mt-1">{divider}</LabeledDivider> : null}
    </div>
  );
}
