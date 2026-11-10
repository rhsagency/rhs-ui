"use client";

import { useEffect, useRef } from "react";

import { cssString, pageNumbers } from "@rhs-ui/marketing/print-letterhead/margin-boxes";

export interface RunningLineProps {
  /** The page address to print. Leave it out to print the address the reader is on. */
  url?: string;
  /** The word before the date: "Printed". */
  printedLabel: string;
  /** The word before the page number: "Page". */
  pageLabel: string;
  /** The word between the page number and the page count: "of". */
  pageOfLabel: string;
  /** The locale the date is written in. */
  locale: string;
  /** The IANA time zone the date is read in. */
  timeZone: string;
}

/** "10 November 2026", in the locale and the zone given. A locale or a zone the browser does not know falls back to UTC and US English. */
function written(moment: Date, locale: string, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone }).format(moment);
  } catch {
    return new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeZone: "UTC" }).format(moment);
  }
}

/**
 * The running footer of every printed page: the page address on the left and
 * "Printed 10 November 2026 · Page 2 of 5" on the right. It is written into the
 * bottom page margin (`@bottom-left` and `@bottom-right`), which sits outside the
 * text area, so page text can never print over it. A page does not know when it
 * will be printed, so the style element that holds the two strings is rewritten at
 * the moment the browser starts to print (`beforeprint`) and once when the page
 * loads, straight into the element, never through a render that might come too
 * late. Without script the page numbers (and the address, when you pass one) are
 * still printed, and the date is left out rather than guessed. A browser that has
 * no margin boxes prints no running footer at all, which beats one over the text.
 * Everything else in the letterhead is plain CSS.
 */
export function RunningLine({ url, printedLabel, pageLabel, pageOfLabel, locale, timeZone }: RunningLineProps) {
  const sheet = useRef<HTMLStyleElement>(null);

  useEffect(() => {
    const write = () => {
      if (!sheet.current) return;
      const address = url ?? window.location.href;
      const printed = `${printedLabel} ${written(new Date(), locale, timeZone)}`;
      sheet.current.textContent = `@page{@bottom-left{content:"${cssString(address)}"}@bottom-right{content:${pageNumbers(pageLabel, pageOfLabel, printed)}}}`;
    };
    write();
    window.addEventListener("beforeprint", write);
    return () => window.removeEventListener("beforeprint", write);
  }, [url, printedLabel, pageLabel, pageOfLabel, locale, timeZone]);

  return <style ref={sheet} data-slot="print-letterhead-margins" />;
}
