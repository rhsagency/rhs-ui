import type { ComboboxOption } from "@rhs-ui/primitives/combobox";

/** ISO 3166-1 alpha-2 codes, for a footer that offers every country. The names come from the browser, in the language of the page (Intl.DisplayNames). */
export const COUNTRY_CODES =
  "AD AE AF AG AI AL AM AO AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GT GU GW GY HK HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG US UY UZ VA VC VE VG VI VN VU WF WS XK YE YT ZA ZM ZW".split(" ");

/** The flag of a country, as the two regional-indicator letters that spell its code. */
const flag = (code: string) => String.fromCodePoint(...[...code.toUpperCase()].map((char) => 0x1f1e6 + char.charCodeAt(0) - 65));

/** Names countries in a language, with one Intl.DisplayNames behind it. A code the browser does not know comes back as the code, so a typo shows instead of breaking the footer. */
function countryNamer(locale: string): (code: string) => string {
  let names: Intl.DisplayNames | null = null;
  try {
    names = new Intl.DisplayNames([locale], { type: "region" });
  } catch {
    names = null;
  }
  return (code) => {
    try {
      return names?.of(code.toUpperCase()) ?? code;
    } catch {
      return code;
    }
  };
}

/** The name of a country in a language: "Netherlands", "Nederland". */
export function countryName(code: string, locale: string): string {
  return countryNamer(locale)(code);
}

export interface CountryOptionsInput {
  /** The countries on offer, as ISO codes. Left out, every country. */
  only?: readonly string[];
  /** Countries listed first, under their own heading. */
  suggested?: readonly string[];
  /** The language of the names. */
  locale: string;
  /** The heading over the suggested countries. */
  suggestedLabel: string;
  /** The heading over the rest, shown when there are suggested countries. */
  allLabel: string;
}

/**
 * The options of the country list: the suggested countries first, then the rest by name in the language of the page, each with its flag and
 * with its code as a search keyword. The two headings are passed in, so they can be in that language too.
 */
export function countryOptions({ only, suggested = [], locale, suggestedLabel, allLabel }: CountryOptionsInput): ComboboxOption[] {
  const codes = only ?? COUNTRY_CODES;
  const nameOf = countryNamer(locale);
  const make = (code: string, group?: string): ComboboxOption => ({ value: code, label: `${flag(code)}  ${nameOf(code)}`, keywords: [code, nameOf(code)], group });
  const top = suggested.filter((code) => codes.includes(code)).map((code) => make(code, suggestedLabel));
  const rest = codes
    .filter((code) => !suggested.includes(code))
    .sort((a, b) => nameOf(a).localeCompare(nameOf(b), locale))
    .map((code) => make(code, top.length ? allLabel : undefined));
  return [...top, ...rest];
}
