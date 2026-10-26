import type { ComponentProps, ReactNode } from "react";

import { IconGlobe } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export type CountryLabelType = "region" | "language" | "currency";

export interface CountryLabelProps extends Omit<ComponentProps<"span">, "children"> {
  /** An ISO 3166-1 alpha-2 country code ("NL", "de" works too), or with `type` a language code ("pt-BR") or an ISO 4217 currency code ("EUR"). */
  code: string;
  /** What the code is. Default "region". */
  type?: CountryLabelType;
  /** The reader's language, which the name is written in: "nl" gives "Duitsland", "de" gives "Deutschland". Defaults to "en-US". */
  locale?: string;
  /** Draw the tile before the name: the flag of a country, the letters of a language, the symbol of a currency. Default true. */
  showFlag?: boolean;
  /** Write the code after the name, in muted mono type. */
  showCode?: boolean;
  /** Shown instead of the code when Intl does not know it. Defaults to the code itself. */
  fallback?: ReactNode;
}

const cache = new Map<string, Intl.DisplayNames>();

/**
 * A name can hold a thin or narrow no-break space, and the version of the Unicode data decides which: a server and a browser with different versions
 * then write different text, and React throws the server markup away. A plain space looks the same and every engine agrees on it.
 */
const tidy = (text: string) => text.replace(/[\u00a0\u2009\u202f]/g, " ");

/** The name Intl gives a code in the locale, or undefined when it does not know it, or the code is not even shaped like one. */
function nameOf(code: string, type: CountryLabelType, locale: string): string | undefined {
  try {
    const key = `${locale}|${type}`;
    let names = cache.get(key);
    if (!names) {
      names = new Intl.DisplayNames(locale, { type, fallback: "none" });
      cache.set(key, names);
    }
    const name = names.of(code);
    return name === undefined ? undefined : tidy(name);
  } catch {
    return undefined;
  }
}

/** The flag as the two regional indicator letters that make it. A platform without flag glyphs draws the two letters, which still read as the country. */
function flagOf(region: string): string {
  return /^[A-Z]{2}$/.test(region) ? String.fromCodePoint(...Array.from(region, (char) => 0x1f1e6 + char.charCodeAt(0) - 65)) : "";
}

/** The narrow symbol of a currency ("€", "$", "kr"), or nothing when Intl does not know the code. */
function symbolOf(currency: string, locale: string): string {
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency, currencyDisplay: "narrowSymbol" }).formatToParts(0).find((part) => part.type === "currency")?.value ?? "";
  } catch {
    return "";
  }
}

/**
 * A country, a language or a currency named in the reader's language, with its
 * flag: for tables, addresses and profiles. The names come from
 * Intl.DisplayNames, so "Duitsland", "Germany" and "Deutschland" are right for
 * each reader without a data file, and the language of the name is set on the
 * text. The flag is decorative and hidden from assistive technology; it is
 * drawn from the two regional indicator letters of the code in a tile of fixed
 * size, so a row of labels lines up even where a platform has no flag glyphs
 * and shows the letters instead. Windows has none in Chrome and Edge, so there
 * the tile reads "NL", not a flag; a flag polyfill font such as Twemoji Country
 * Flags, added to the font stack of your page, brings them back. An unknown
 * code renders as the code itself, with a globe, never as an error. A Server
 * Component.
 */
export function CountryLabel({ code, type = "region", locale = "en-US", showFlag = true, showCode = false, fallback, className, ...props }: CountryLabelProps) {
  const clean = code.trim();
  // Regions and currencies are written in capitals; a language keeps its case, Intl reads it either way.
  const key = type === "language" ? clean : clean.toUpperCase();
  const name = clean ? nameOf(key, type, locale) : undefined;
  const known = name !== undefined;

  let tile: ReactNode = null;
  if (showFlag) {
    if (type === "region") tile = known ? flagOf(key) : <IconGlobe className="size-[1.5em] text-muted-foreground" />;
    else if (type === "currency") tile = known ? symbolOf(key, locale) || key : key;
    else tile = key.split("-")[0]?.toUpperCase() ?? key;
  }

  return (
    <span data-slot="country-label" data-type={type} data-known={known} className={cn("inline-flex max-w-full min-w-0 items-center gap-[0.55em]", className)} {...props}>
      {showFlag ? (
        // The tile is the same size for a flag, a language and a currency; only what is drawn in it differs.
        <span
          aria-hidden="true"
          data-slot="country-label-tile"
          className="inline-flex h-[1.15em] w-[1.55em] shrink-0 items-center justify-center overflow-hidden rounded-[0.22em] bg-muted leading-none ring-1 ring-foreground/10 ring-inset"
        >
          <span className={type === "region" && known ? "text-[0.98em] leading-none" : "font-mono text-[0.66em] leading-none font-medium tracking-tight text-muted-foreground"}>{tile}</span>
        </span>
      ) : null}
      <span lang={known ? locale : undefined} className="min-w-0 truncate">
        {known ? name : (fallback ?? clean)}
      </span>
      {showCode && clean ? <span className="shrink-0 font-mono text-[0.8em] text-muted-foreground">{type === "language" ? clean : key}</span> : null}
    </span>
  );
}
