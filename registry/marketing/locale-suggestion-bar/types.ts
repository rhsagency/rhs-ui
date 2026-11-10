/** A language version of the site. */
export interface LocaleOption {
  /** A language tag: "en", "de", "pt-BR". It becomes the lang of the bar when it is the suggestion. */
  code: string;
  /** The version named in itself: "Deutsch". */
  label: string;
  /** Where that version lives. */
  href: string;
}

/** The version you offer, and the words to offer it in. Everything the bar says is in this language, so everything is here. */
export interface LocaleSuggestion extends LocaleOption {
  /** The question, in the suggested language: "Möchten Sie die deutsche Website sehen?" */
  question: string;
  /** The primary button, in the suggested language: "Zur deutschen Website wechseln". */
  switchLabel: string;
  /** The quiet button, in the suggested language: "Auf dieser Seite bleiben". */
  stayLabel: string;
  /** The name of the close button, in the suggested language: "Schließen". */
  closeLabel: string;
}
