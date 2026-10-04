"use client";

import { IconGlobe } from "@rhs-ui/icons";
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from "@rhs-ui/primitives/dropdown-menu";
import { cn } from "@/lib/utils";

export interface SiteLanguage {
  /** BCP 47 code: "nl", "en-GB". */
  code: string;
  /** The language in its own words: "Nederlands", "English". */
  name: string;
}

export interface LanguageSwitcherProps {
  languages: readonly SiteLanguage[];
  current: string;
  /** Navigate to the same page in the chosen language. */
  onChange: (code: string) => void;
  className?: string;
}

/**
 * The language menu for a site header or footer: a globe and the short code
 * on the trigger, each language named in itself in the menu (people look for
 * "Deutsch", not "German"), with lang set so a screen reader pronounces it.
 */
export function LanguageSwitcher({ languages, current, onChange, className }: LanguageSwitcherProps) {
  const active = languages.find((language) => language.code === current);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger data-slot="language-switcher" aria-label={`Language: ${active?.name ?? current}`} className={cn("inline-flex h-9 items-center gap-1.5 rounded-full border border-border px-3 text-sm outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40", className)}>
        <IconGlobe aria-hidden="true" className="size-4" />
        <span className="uppercase">{current.split("-")[0]}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Language</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={current} onValueChange={onChange}>
          {languages.map((language) => (
            <DropdownMenuRadioItem key={language.code} value={language.code} lang={language.code}>{language.name}</DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
