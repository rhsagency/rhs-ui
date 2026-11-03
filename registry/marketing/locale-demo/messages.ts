/** The words the sample card needs in one language: its row labels, and the sample noun in every plural form the language has. */
export interface LocaleMessages {
  /** The label of the price row. */
  price: string;
  /** The label of the date row. */
  date: string;
  /** The label of the number row. */
  number: string;
  /** The label of the relative time row. */
  relative: string;
  /** The label of the plural row. */
  plural: string;
  /** What the count is a count of, once for each plural form the language has. {count} stands for the formatted number. `other` is the one every language has; the rest are used where the language's rules pick them. */
  items: { other: string } & Partial<Record<Intl.LDMLPluralRule, string>>;
}

/** A locale in the switch. */
export interface LocaleOption {
  /** A BCP 47 tag: "de-DE". It is what Intl formats with. */
  code: string;
  /** The name shown in the switch, in the language itself: "Deutsch". */
  label: string;
  /** Words for the card, for a language that is not built in. Whatever is missing falls back to English. */
  messages?: Partial<LocaleMessages>;
}

/** Five markets that between them differ in grouping, decimal marks, symbols, date order, digits, plural forms and direction. */
export const DEFAULT_LOCALES: readonly LocaleOption[] = [
  { code: "en-US", label: "English" },
  { code: "nl-NL", label: "Nederlands" },
  { code: "de-DE", label: "Deutsch" },
  { code: "ja-JP", label: "日本語" },
  { code: "ar-EG", label: "العربية" },
];

const ENGLISH: LocaleMessages = {
  price: "Price",
  date: "Date",
  number: "Number",
  relative: "Relative time",
  plural: "Plural",
  items: { one: "{count} item", other: "{count} items" },
};

/** The built-in languages, by language subtag. */
const BUILT_IN: Record<string, LocaleMessages> = {
  en: ENGLISH,
  nl: { price: "Prijs", date: "Datum", number: "Getal", relative: "Relatieve tijd", plural: "Meervoud", items: { one: "{count} artikel", other: "{count} artikelen" } },
  de: { price: "Preis", date: "Datum", number: "Zahl", relative: "Relative Zeit", plural: "Plural", items: { one: "{count} Artikel", other: "{count} Artikel" } },
  ja: { price: "価格", date: "日付", number: "数値", relative: "相対時間", plural: "複数形", items: { other: "{count}点" } },
  ar: {
    price: "السعر",
    date: "التاريخ",
    number: "العدد",
    relative: "الوقت النسبي",
    plural: "الجمع",
    items: { zero: "لا عناصر", one: "عنصر واحد", two: "عنصران", few: "{count} عناصر", many: "{count} عنصرًا", other: "{count} عنصر" },
  },
};

/** The words for a locale: what you passed for it, over the built-in language if there is one, over English. */
export function messagesFor(option: LocaleOption): LocaleMessages {
  const language = (option.code.split("-")[0] ?? "").toLowerCase();
  const base = BUILT_IN[language] ?? ENGLISH;
  return { ...base, ...option.messages, items: { ...base.items, ...option.messages?.items } };
}
