/** What the visitor chose: three codes, which is all your callback needs to switch the site, the copy and the prices. */
export interface Region {
  /** An ISO 3166-1 alpha-2 code: "NL". */
  country: string;
  /** Your own code for the language: "en", "nl", "pt-BR". */
  language: string;
  /** An ISO 4217 code: "EUR". */
  currency: string;
}

/** One option of the language or the currency list. */
export interface RegionChoice {
  /** What goes in the Region: "de", "EUR". */
  value: string;
  /** What the visitor reads. A language is named in itself ("Deutsch"), a currency by its code ("EUR"). */
  label: string;
  /** A second line in the list: "German", "Euro". The summary and the closed field show the label only. */
  hint?: string;
}

export interface RegionOptions {
  /** The countries on offer, as ISO codes. Left out, every country. */
  countries?: readonly string[];
  /** Countries listed first, under Suggested: where most of your customers are. */
  suggestedCountries?: readonly string[];
  languages: readonly RegionChoice[];
  currencies: readonly RegionChoice[];
}

/** The fixed words, for a site that is not in English. */
export interface RegionLabels {
  /** The heading of the group, the title of the dialog on a phone, and the first words of the phone button for a screen reader. */
  region: string;
  /** The label of the country field, which also names its list for a screen reader. */
  country: string;
  language: string;
  currency: string;
  /** What the closed country field says while no country is chosen. */
  chooseCountry: string;
  /** The placeholder of the search field in the country list. */
  searchCountries: string;
  /** What the country list says when nothing matches the search. */
  noCountry: string;
  /** The heading over your suggested countries, at the top of the list. */
  suggested: string;
  /** The heading over all the other countries. */
  allCountries: string;
  /** Said under the title of the dialog on a phone. */
  description: string;
  /** The button that closes the dialog. */
  done: string;
  /** What a screen reader hears after a link that opens in a new tab. */
  newTab: string;
}

export const REGION_LABELS: RegionLabels = {
  region: "Region",
  country: "Country",
  language: "Language",
  currency: "Currency",
  chooseCountry: "Choose a country",
  searchCountries: "Search countries",
  noCountry: "No country found",
  suggested: "Suggested",
  allCountries: "All countries",
  description: "Choose the country you shop from, the language of the site and the currency of the prices.",
  done: "Done",
  newTab: "opens in a new tab",
};
