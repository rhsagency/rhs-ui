/**
 * The arithmetic behind the Barcode field, as plain functions with no React:
 * the GS1 check digit, the three retail formats and how a number is printed.
 * A server can call `isValidBarcode` to check a number before it is stored,
 * the same way the field does while it is typed.
 */

/** The three retail number formats: EAN-13 (the world), UPC-A (North America) and EAN-8 (small packs). */
export type BarcodeFormat = "ean13" | "upca" | "ean8";

/** A format, or `auto`, which reads the format from the number of digits. */
export type BarcodeFormatOption = BarcodeFormat | "auto";

export interface BarcodeFormatInfo {
  /** The name as printed on a spec sheet. */
  label: string;
  /** How many digits the number has, the check digit included. */
  length: number;
  /** How the digits are grouped on a pack: EAN-13 is 1, 6 and 6 ("4 006381 333931"). */
  groups: readonly number[];
}

export const BARCODE_FORMATS: Readonly<Record<BarcodeFormat, BarcodeFormatInfo>> = {
  ean13: { label: "EAN-13", length: 13, groups: [1, 6, 6] },
  upca: { label: "UPC-A", length: 12, groups: [1, 5, 5, 1] },
  ean8: { label: "EAN-8", length: 8, groups: [4, 4] },
};

/** Shortest first, which is the order `auto` narrows the candidates down. */
const BY_LENGTH: readonly BarcodeFormat[] = ["ean8", "upca", "ean13"];

/**
 * The digits of whatever was typed or pasted, at most `maxLength` of them.
 * Spaces, hyphens and letters are dropped. A number that is too long loses
 * zeros from the front first, since a GTIN-14 is an EAN-13 with a zero before
 * it, and then digits from the end.
 */
export function cleanBarcode(text: string, maxLength = 13): string {
  let digits = text.replace(/\D/g, "");
  const spare = digits.length - maxLength;
  if (spare > 0) digits = digits.slice(Math.min(spare, digits.length - digits.replace(/^0+/, "").length));
  return digits.slice(0, maxLength);
}

/**
 * The GS1 check digit for the digits in front of it: from the right, the
 * digits count three and one in turn, and the check digit brings the sum up to
 * a multiple of ten. The same rule serves EAN-13, UPC-A and EAN-8, whatever the
 * length. `checkDigit("400638133393")` is "1".
 */
export function checkDigit(body: string): string {
  let sum = 0;
  for (let index = body.length - 1, weight = 3; index >= 0; index -= 1, weight = 4 - weight) sum += Number(body[index]) * weight;
  return String((10 - (sum % 10)) % 10);
}

/** Whether the last digit of `digits` is the check digit the digits before it ask for. The length is not looked at. */
function endsRight(digits: string): boolean {
  return digits.length > 1 && checkDigit(digits.slice(0, -1)) === digits.slice(-1);
}

/**
 * Whether a number is a complete, correct barcode number: the right number of
 * digits for the format and the right check digit. With `auto` (the default) a
 * number is right when it is a correct EAN-13, UPC-A or EAN-8.
 */
export function isValidBarcode(digits: string, format: BarcodeFormatOption = "auto"): boolean {
  if (!/^\d+$/.test(digits)) return false;
  const formats = format === "auto" ? BY_LENGTH : [format];
  return formats.some((name) => BARCODE_FORMATS[name].length === digits.length && endsRight(digits));
}

/** The digits grouped the way the format prints them, also while the number is only part typed: "4 006381 33". */
export function groupBarcode(digits: string, format: BarcodeFormat = "ean13"): string {
  const parts: string[] = [];
  let at = 0;
  for (const size of BARCODE_FORMATS[format].groups) {
    if (at >= digits.length) break;
    parts.push(digits.slice(at, at + size));
    at += size;
  }
  return parts.join(" ");
}

/** Where a number stands: nothing typed, on the way, one digit short, complete and wrong, complete and right. */
export type BarcodeState = "empty" | "partial" | "offer" | "wrong" | "valid";

export interface BarcodeReading {
  /** The digits, without spaces. */
  digits: string;
  /** The format the digits are read as. With `auto` it is null until the number is long enough to tell. */
  format: BarcodeFormat | null;
  /** The pattern to group the digits in: the format when it is known, otherwise EAN-13, the most common. */
  groupAs: BarcodeFormat;
  state: BarcodeState;
  /** Complete and the check digit is right. */
  valid: boolean;
  /** The check digit the number asks for: set when it is one digit short (`offer`) and when the last digit is wrong (`wrong`). */
  expected: string | null;
  /** In `offer`, with `auto`, when the twelve digits might also be a UPC-A: the last digit that would have made it one. */
  asUpca: string | null;
  /** The formats the digits can still become, shortest first. */
  candidates: readonly BarcodeFormat[];
}

/**
 * Reads a number: which format it is, whether the check digit is right, and
 * what the check digit should be when it is not there yet or is wrong. With
 * `auto`, twelve digits that are a correct UPC-A are one; twelve that are not
 * count as an EAN-13 waiting for its check digit.
 */
export function readBarcode(text: string, format: BarcodeFormatOption = "auto"): BarcodeReading {
  const longest = format === "auto" ? 13 : BARCODE_FORMATS[format].length;
  const digits = cleanBarcode(text, longest);
  const candidates = BY_LENGTH.filter((name) => BARCODE_FORMATS[name].length >= digits.length && (format === "auto" || name === format));
  const base = { digits, candidates, expected: null, asUpca: null, valid: false };

  if (digits === "") return { ...base, format: format === "auto" ? null : format, groupAs: format === "auto" ? "ean13" : format, state: "empty" };

  if (format !== "auto") {
    const length = BARCODE_FORMATS[format].length;
    const common = { ...base, format, groupAs: format };
    if (digits.length === length - 1) return { ...common, state: "offer", expected: checkDigit(digits) };
    if (digits.length < length) return { ...common, state: "partial" };
    return endsRight(digits) ? { ...common, state: "valid", valid: true } : { ...common, state: "wrong", expected: checkDigit(digits.slice(0, -1)) };
  }

  // Auto: the length says what it can be.
  if (digits.length === 13) {
    return endsRight(digits)
      ? { ...base, format: "ean13", groupAs: "ean13", state: "valid", valid: true }
      : { ...base, format: "ean13", groupAs: "ean13", state: "wrong", expected: checkDigit(digits.slice(0, -1)) };
  }
  if (digits.length === 12) {
    if (endsRight(digits)) return { ...base, format: "upca", groupAs: "upca", state: "valid", valid: true };
    return { ...base, format: null, groupAs: "ean13", state: "offer", expected: checkDigit(digits), asUpca: checkDigit(digits.slice(0, -1)) };
  }
  if (digits.length === 8 && endsRight(digits)) return { ...base, format: "ean8", groupAs: "ean8", state: "valid", valid: true };
  return { ...base, format: null, groupAs: "ean13", state: "partial" };
}
