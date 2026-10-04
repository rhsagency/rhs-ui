"use client";

import { useMemo } from "react";

import { Combobox, type ComboboxOption } from "@rhs-ui/primitives/combobox";

/** ISO 3166-1 alpha-2 codes. Names come from the browser in the reader's language (Intl.DisplayNames). */
const CODES =
  "AD AE AF AG AI AL AM AO AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GT GU GW GY HK HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG US UY UZ VA VC VE VG VI VN VU WF WS XK YE YT ZA ZM ZW".split(" ");

const flag = (code: string) => String.fromCodePoint(...[...code].map((char) => 0x1f1e6 + char.charCodeAt(0) - 65));

export interface CountrySelectProps {
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (code: string) => void;
  /** Countries listed first, under "Suggested": where most of your customers are. */
  suggested?: readonly string[];
  /** Limit the list, e.g. to the countries you ship to. */
  only?: readonly string[];
  /** Language of the names; the reader's own by default. */
  locale?: string;
  name?: string;
  id?: string;
  required?: boolean;
  className?: string;
}

/**
 * A country picker on the house combobox, never a native select: every
 * country named in the reader's language by the browser, with its flag, a
 * search that also matches the ISO code, your most common countries on top,
 * and the code submitted through a hidden input.
 */
export function CountrySelect({ value, defaultValue, onValueChange, suggested = [], only, locale = "en-GB", name, id, required, className }: CountrySelectProps) {
  const options = useMemo<ComboboxOption[]>(() => {
    const names = new Intl.DisplayNames([locale], { type: "region" });
    const codes = only ?? CODES;
    const nameOf = (code: string) => names.of(code) ?? code;
    const make = (code: string, group?: string): ComboboxOption => ({ value: code, label: `${flag(code)}  ${nameOf(code)}`, keywords: [code, nameOf(code)], group });
    const top = suggested.filter((code) => codes.includes(code)).map((code) => make(code, "Suggested"));
    const rest = codes.filter((code) => !suggested.includes(code)).sort((a, b) => nameOf(a).localeCompare(nameOf(b), locale)).map((code) => make(code, suggested.length ? "All countries" : undefined));
    return [...top, ...rest];
  }, [locale, only, suggested]);
  return <Combobox options={options} value={value} defaultValue={defaultValue} onValueChange={onValueChange} label="Country" placeholder="Choose a country" searchPlaceholder="Search countries" emptyText="No country found" name={name} id={id} required={required} className={className} />;
}
