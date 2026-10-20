"use client";

import { useEffect, useId, useRef, useState, type ComponentProps } from "react";

import { IconAlertCircle, IconCheck, IconChevronDown, IconCopy, IconExternal, IconNavigation } from "@rhs-ui/icons";
import {
  APP_NAMES,
  appsForMode,
  buildDirectionsUrl,
  copyTextOf,
  copyToClipboard,
  orderApps,
  placeProblem,
  prefersAppleMaps,
  type DirectionsApp,
  type DirectionsPlace,
  type TravelMode,
} from "@rhs-ui/application/directions-button/directions";
import { Button, type ButtonProps } from "@rhs-ui/primitives/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@rhs-ui/primitives/dropdown-menu";
import { cn } from "@/lib/utils";

export interface DirectionsButtonProps extends Omit<ComponentProps<"div">, "children"> {
  /** The place to go to: an address (with its name, so the pin is labelled) or latitude and longitude. */
  destination: DirectionsPlace;
  /** Where the route starts. Leave it out to start from the person's own position. */
  origin?: DirectionsPlace;
  /** How they travel. Waze only drives, so it is left out for the other modes. Default "driving". */
  mode?: TravelMode;
  /** The apps to offer, in order of preference. Without it: Apple Maps first on iPhone and iPad, Google Maps first everywhere else. */
  apps?: readonly DirectionsApp[];
  /** The button's text. Default "Get directions". */
  label?: string;
  /** Called when a maps link is opened, with the app. */
  onOpen?: (app: DirectionsApp) => void;
  /** Any Button variant. Default "outline". */
  variant?: ButtonProps["variant"];
  /** Any Button size. */
  size?: ButtonProps["size"];
}

type CopyState = "idle" | "copied" | "failed";

const TILE: Record<DirectionsApp, string> = { apple: "A", google: "G", waze: "W" };
// The divider between two solid buttons, where there is no shared border to draw it.
const DIVIDER: Partial<Record<NonNullable<ButtonProps["variant"]>, string>> = {
  default: "border-l-primary-foreground/30",
  secondary: "border-l-foreground/15",
  destructive: "border-l-destructive-foreground/30",
};

function AppRow({ app }: { app: DirectionsApp }) {
  return (
    <>
      <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-md border border-border bg-muted/60 text-xs font-semibold text-foreground">
        {TILE[app]}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm leading-tight font-medium text-foreground">{APP_NAMES[app]}</span>
        <span className="mt-0.5 block text-xs text-muted-foreground">Opens in a new tab</span>
      </span>
      <IconExternal className="size-3.5" />
    </>
  );
}

/**
 * A button that hands a place to a maps app. The main button is a real link
 * to the app people use: Apple Maps on an iPhone or iPad, Google Maps
 * everywhere else, worked out after the page has loaded so server and browser
 * markup agree. A small chevron opens the other apps and "Copy address". The
 * place's name goes into the query, so the pin is labelled; links are built
 * by exported pure functions with proper encoding. Every external link says it
 * opens a new tab, and a place without an address or coordinates disables the
 * button and says why.
 */
export function DirectionsButton({ destination, origin, mode = "driving", apps, label = "Get directions", onOpen, variant = "outline", size, className, ...props }: DirectionsButtonProps) {
  const reasonId = useId();
  const [apple, setApple] = useState(false);
  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState<{ align: "start" | "end"; offset: number }>({ align: "end", offset: 0 });
  const group = useRef<HTMLDivElement>(null);
  const chevron = useRef<HTMLButtonElement>(null);
  const [copy, setCopy] = useState<CopyState>("idle");
  const timers = useRef<number[]>([]);

  // Whether this is an iPhone or iPad is only known in the browser, so it is worked out after mount and the server and the first render agree.
  useEffect(() => {
    setApple(prefersAppleMaps({ userAgent: navigator.userAgent, platform: navigator.platform, maxTouchPoints: navigator.maxTouchPoints }));
    // Read at cleanup time on purpose: the list is replaced every time a copy starts.
    return () => timers.current.forEach((timer) => window.clearTimeout(timer));
  }, []);

  const offered = appsForMode(orderApps(apps, apple), mode);
  const problem = placeProblem(destination) ?? (offered.length ? null : "None of these apps give directions for this way of travelling.");
  const [first, ...others] = offered;
  const options = { origin, mode };
  const primaryHref = first && !problem ? buildDirectionsUrl(first, destination, options) : null;
  const copyText = copyTextOf(destination);
  const chevronSize = size === "sm" ? "icon-sm" : "icon";

  // The menu lines up with the whole control, not just the chevron: its left edge in the left half of the screen, its right edge in the right half.
  function changeOpen(next: boolean) {
    const box = group.current?.getBoundingClientRect();
    const trigger = chevron.current?.getBoundingClientRect();
    if (next && box && trigger) setPlacement(box.left + box.width / 2 > window.innerWidth / 2 ? { align: "end", offset: 0 } : { align: "start", offset: box.left - trigger.left });
    setOpen(next);
  }

  async function copyAddress() {
    if (!copyText) return;
    timers.current.forEach((timer) => window.clearTimeout(timer));
    const done = await copyToClipboard(copyText);
    setCopy(done ? "copied" : "failed");
    // The result shows in the menu for a moment, then the menu folds away.
    timers.current = [window.setTimeout(() => setOpen(false), done ? 900 : 1600), window.setTimeout(() => setCopy("idle"), done ? 1400 : 2100)];
  }

  const joinLeft = "min-w-0 shrink rounded-r-none hover:z-[1] focus-visible:z-10";
  const joinRight = cn("-ml-px rounded-l-none hover:z-[1] focus-visible:z-10", size === "lg" && "size-11", DIVIDER[variant ?? "outline"]);

  return (
    <div data-slot="directions-button" className={cn("inline-flex max-w-full flex-col items-start gap-1.5", className)} {...props}>
      <span role="status" className="sr-only">
        {copy === "copied" ? "Address copied" : copy === "failed" ? "Could not copy the address" : ""}
      </span>
      {primaryHref && first ? (
        <div ref={group} role="group" aria-label={label} className="inline-flex max-w-full items-stretch">
          <Button asChild variant={variant} size={size} className={joinLeft}>
            <a href={primaryHref} target="_blank" rel="noopener noreferrer" title={`Opens ${APP_NAMES[first]} in a new tab`} onClick={() => onOpen?.(first)}>
              <IconNavigation />
              <span className="truncate">{label}</span>
              <span className="sr-only">
                {" "}
                in {APP_NAMES[first]}, opens in a new tab
              </span>
            </a>
          </Button>
          <DropdownMenu open={open} onOpenChange={changeOpen}>
            <DropdownMenuTrigger asChild>
              <Button ref={chevron} type="button" variant={variant} size={chevronSize} aria-label="More ways to get directions" className={joinRight}>
                <IconChevronDown className="transition-transform duration-200 group-data-[state=open]/button:rotate-180 motion-reduce:transition-none" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={placement.align} alignOffset={placement.offset} collisionPadding={8} className="w-72 max-w-[calc(100vw-2rem)]">
              {others.length ? <DropdownMenuLabel>Also open in</DropdownMenuLabel> : null}
              {others.map((app) => {
                const href = buildDirectionsUrl(app, destination, options);
                return href ? (
                  <DropdownMenuItem key={app} asChild className="gap-3 py-2">
                    <a href={href} target="_blank" rel="noopener noreferrer" onClick={() => onOpen?.(app)}>
                      <AppRow app={app} />
                    </a>
                  </DropdownMenuItem>
                ) : null;
              })}
              {others.length && copyText ? <DropdownMenuSeparator /> : null}
              {copyText ? (
                <DropdownMenuItem
                  className="gap-3 py-2"
                  onSelect={(event) => {
                    // Stay open: the item says what happened, then the menu closes by itself.
                    event.preventDefault();
                    void copyAddress();
                  }}
                >
                  <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-md border border-border bg-muted/60">
                    {copy === "copied" ? <IconCheck className="size-4 text-foreground" /> : copy === "failed" ? <IconAlertCircle className="size-4 text-destructive" /> : <IconCopy className="size-4" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm leading-tight font-medium text-foreground">
                      {copy === "copied" ? "Copied" : copy === "failed" ? "Could not copy" : destination.address?.trim() ? "Copy address" : "Copy coordinates"}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-muted-foreground">{copyText}</span>
                  </span>
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ) : (
        <>
          <Button type="button" variant={variant} size={size} disabled aria-describedby={reasonId} className="max-w-full">
            <IconNavigation />
            <span className="truncate">{label}</span>
          </Button>
          <p id={reasonId} className="text-xs text-muted-foreground">
            {problem}
          </p>
        </>
      )}
    </div>
  );
}
