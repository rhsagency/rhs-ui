"use client";

import { useEffect, type ComponentProps, type MouseEvent } from "react";

import { IconArrowLeft } from "@rhs-ui/icons";
import { Button, type ButtonProps } from "@rhs-ui/primitives/button";

export interface BackButtonProps extends Omit<ComponentProps<"a">, "href" | "children" | "onClick"> {
  /** Where to go when there is no earlier page on your site: arriving from a search result or a shared link. It is also the link's real `href`. */
  fallbackHref: string;
  /** The visible label. */
  label?: string;
  /** Where it goes back to, added to the accessible name only: "Orders" gives "Back to Orders". */
  context?: string;
  /** Hand the press to your router. It gets `true` when the previous page is on your site (go back) and `false` otherwise (go to `fallbackHref`). The browser's own navigation is then skipped. */
  onBack?: (canGoBack: boolean) => void;
  /** Any Button variant; a ghost button suits a page header. */
  variant?: ButtonProps["variant"];
  /** Any Button size. */
  size?: ButtonProps["size"];
}

const KEY = "rhs-ui:back-depth";
let seen = false;
let counted = "";

const sameSite = (url: string) => {
  try {
    return url !== "" && new URL(url).origin === window.location.origin;
  } catch {
    return false;
  }
};

/**
 * Where the browser has no Navigation API, a page keeps a count of the pages of
 * this site that came before it in the tab. A fresh load starts from the
 * referrer (a page of ours counts as one, a search result or a shared link as
 * none); every page view after that in the same load adds one.
 */
function countView() {
  try {
    if (counted === window.location.href) return;
    counted = window.location.href;
    let depth = Number(window.sessionStorage.getItem(KEY)) || 0;
    if (seen) depth += 1;
    else depth = sameSite(document.referrer) ? Math.max(depth, 1) : 0;
    seen = true;
    window.sessionStorage.setItem(KEY, String(depth));
  } catch {
    /* Storage is blocked: the count stays at zero and the button uses its fallback. */
  }
}

/** Is the entry before this one a page of this site? The Navigation API knows; otherwise the count does. */
function canGoBack(): boolean {
  const navigation = (window as { navigation?: { canGoBack?: boolean } }).navigation;
  if (typeof navigation?.canGoBack === "boolean") return navigation.canGoBack;
  try {
    return window.history.length > 1 && (Number(window.sessionStorage.getItem(KEY)) || 0) > 0;
  } catch {
    return false;
  }
}

/**
 * A back link that returns to where the person came from and falls back to a
 * safe page when there is no history, so it never throws anyone off your site.
 * It is a real anchor with an `href`, so middle click, copy link and no
 * JavaScript all work; a plain click goes back only when the previous page is
 * yours. The arrow nudges left on hover where motion is allowed.
 */
export function BackButton({ fallbackHref, label = "Back", context, onBack, variant = "ghost", size, className, ...props }: BackButtonProps) {
  useEffect(countView, []);

  function onClick(event: MouseEvent<HTMLAnchorElement>) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const back = canGoBack();
    if (onBack) {
      event.preventDefault();
      onBack(back);
    } else if (back) {
      event.preventDefault();
      window.history.back();
    }
  }

  return (
    <Button asChild variant={variant} size={size} className={className}>
      <a data-slot="back-button" href={fallbackHref} onClick={onClick} {...props}>
        <IconArrowLeft className="transition-transform duration-200 motion-safe:group-hover/button:-translate-x-0.5 motion-safe:group-focus-visible/button:-translate-x-0.5 motion-reduce:transition-none" />
        {label}
        {context ? <span className="sr-only"> to {context}</span> : null}
      </a>
    </Button>
  );
}
