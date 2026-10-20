/** How a tax number looks in one country: what it is called, an example for the hint and, where the shape is fixed, a pattern to check it against. */
export interface TaxIdFormat {
  /** What the number is called there: "VAT number", "EIN", "GSTIN". */
  label: string;
  /** A believable example, shown as the format hint under the field. */
  example?: string;
  /** The source of a regular expression the number must match once spaces, dots and dashes are removed and the letters are capitals. */
  pattern?: string;
}

/**
 * The formats of the countries invoices go to most often, keyed by ISO
 * 3166-1 alpha-2 code. A pattern checks the shape of a number only; whether
 * it belongs to a real company is for `onValidateTaxId` to say (VIES for EU
 * VAT numbers, for example). Pass `taxIdLabels` to the section to add a
 * country or change one.
 */
export const DEFAULT_TAX_ID_FORMATS: Readonly<Record<string, TaxIdFormat>> = {
  AT: { label: "VAT number", example: "ATU12345678", pattern: String.raw`^ATU\d{8}$` },
  AU: { label: "ABN", example: "12 345 678 901", pattern: String.raw`^\d{11}$` },
  BE: { label: "VAT number", example: "BE0123456789", pattern: String.raw`^BE[01]\d{9}$` },
  CA: { label: "Business number", example: "123456789RT0001", pattern: String.raw`^\d{9}(RT\d{4})?$` },
  CH: { label: "UID", example: "CHE-123.456.789 MWST", pattern: String.raw`^CHE\d{9}(MWST|TVA|IVA)?$` },
  DE: { label: "VAT number", example: "DE123456789", pattern: String.raw`^DE\d{9}$` },
  DK: { label: "VAT number", example: "DK12345678", pattern: String.raw`^DK\d{8}$` },
  ES: { label: "VAT number", example: "ESX1234567X", pattern: String.raw`^ES[A-Z0-9]\d{7}[A-Z0-9]$` },
  FI: { label: "VAT number", example: "FI12345678", pattern: String.raw`^FI\d{8}$` },
  FR: { label: "VAT number", example: "FR12345678901", pattern: String.raw`^FR[A-Z0-9]{2}\d{9}$` },
  GB: { label: "VAT number", example: "GB123456789", pattern: String.raw`^GB(\d{9}|\d{12}|GD\d{3}|HA\d{3})$` },
  IE: { label: "VAT number", example: "IE1234567FA", pattern: String.raw`^IE(\d[A-Z0-9+*]\d{5}[A-Z]|\d{7}[A-Z]{1,2})$` },
  IN: { label: "GSTIN", example: "22AAAAA0000A1Z5", pattern: String.raw`^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z\d]Z[A-Z\d]$` },
  IT: { label: "VAT number", example: "IT12345678901", pattern: String.raw`^IT\d{11}$` },
  NL: { label: "VAT number", example: "NL123456789B01", pattern: String.raw`^NL\d{9}B\d{2}$` },
  NO: { label: "VAT number", example: "123456789MVA", pattern: String.raw`^\d{9}(MVA)?$` },
  PL: { label: "VAT number", example: "PL1234567890", pattern: String.raw`^PL\d{10}$` },
  PT: { label: "VAT number", example: "PT123456789", pattern: String.raw`^PT\d{9}$` },
  SE: { label: "VAT number", example: "SE123456789001", pattern: String.raw`^SE\d{12}$` },
  US: { label: "EIN", example: "12-3456789", pattern: String.raw`^\d{9}$` },
};

/** Used for a country that has no entry: a label and nothing to check. */
export const FALLBACK_TAX_ID_FORMAT: TaxIdFormat = { label: "Tax number" };

/** Spaces, dots and dashes out, letters up: the form a pattern is written for. */
export function normaliseTaxId(raw: string): string {
  return raw.replace(/[\s.\-]/g, "").toUpperCase();
}

/** Whether a number has the shape its country asks for. A country without a pattern accepts anything. */
export function matchesTaxId(format: TaxIdFormat, raw: string): boolean {
  if (!format.pattern) return true;
  try {
    return new RegExp(format.pattern).test(normaliseTaxId(raw));
  } catch {
    return true;
  }
}
