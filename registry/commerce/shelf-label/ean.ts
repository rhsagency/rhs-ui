/** The barcodes a shelf label can carry. */
export type BarcodeFormat = "EAN-13" | "EAN-8" | "UPC-A";

/** A barcode worked out and ready to draw: the bars as modules and the digits as they are printed under them. */
export interface Barcode {
  /** The format the digits were read as: 13 digits are an EAN-13, 12 a UPC-A and 8 an EAN-8. */
  format: BarcodeFormat;
  /** The digits, check digit included, without spaces. */
  digits: string;
  /** The bars as one string of modules, "1" for ink and "0" for paper, guards included. */
  modules: string;
  /** The start, middle and end guards as [first, last] positions in `modules`. They are drawn a little longer than the bars. */
  guards: readonly (readonly [number, number])[];
  /** How the digits are written: before the bars, under the left half, under the right half and after the bars. */
  text: { before: string; left: string; right: string; after: string };
}

export type BarcodeResult = { ok: true; code: Barcode } | { ok: false; reason: string };

// The three ways a digit is drawn in seven modules: A on the left half, B on the left half in the other parity, C on the right half.
const L = ["0001101", "0011001", "0010011", "0111101", "0100011", "0110001", "0101111", "0111011", "0110111", "0001011"] as const;
const G = ["0100111", "0110011", "0011011", "0100001", "0011101", "0111001", "0000101", "0010001", "0001001", "0010111"] as const;
const R = ["1110010", "1100110", "1101100", "1000010", "1011100", "1001110", "1010000", "1000100", "1001000", "1110100"] as const;
// The first digit of an EAN-13 chooses which of L and G draws each digit of the left half.
const PARITY = ["LLLLLL", "LLGLGG", "LLGGLG", "LLGGGL", "LGLLGG", "LGGLLG", "LGGGLL", "LGLGLG", "LGLGGL", "LGGLGL"] as const;

const START = "101";
const MIDDLE = "01010";
const END = "101";

/** The digit that closes a code: the digits from the right are weighted 3, 1, 3, 1 and the sum is brought up to a multiple of ten. */
export function checkDigitOf(body: string): number {
  let sum = 0;
  for (let index = 0; index < body.length; index++) sum += Number(body[body.length - 1 - index]) * (index % 2 === 0 ? 3 : 1);
  return (10 - (sum % 10)) % 10;
}

const draw = (table: readonly string[], digit: string): string => table[Number(digit)] ?? "";

/**
 * Turns the digits of an EAN-13, a UPC-A (12 digits) or an EAN-8 into bars. The check digit has to be right: a
 * wrong one would print a code no scanner reads, so it is refused with the digit it should have been, never
 * quietly mended. Spaces and hyphens are ignored.
 */
export function encodeBarcode(input: string): BarcodeResult {
  const digits = input.replace(/[\s-]/g, "");
  if (!/^\d+$/.test(digits)) return { ok: false, reason: "A barcode is made of digits only." };
  if (digits.length !== 8 && digits.length !== 12 && digits.length !== 13) return { ok: false, reason: `An EAN-13, UPC-A or EAN-8 has 13, 12 or 8 digits, this one has ${digits.length}.` };
  const expected = checkDigitOf(digits.slice(0, -1));
  if (Number(digits[digits.length - 1]) !== expected) return { ok: false, reason: `The check digit should be ${expected}.` };

  if (digits.length === 8) {
    const left = digits.slice(0, 4).split("").map((digit) => draw(L, digit)).join("");
    const right = digits.slice(4).split("").map((digit) => draw(R, digit)).join("");
    return {
      ok: true,
      code: {
        format: "EAN-8",
        digits,
        modules: START + left + MIDDLE + right + END,
        guards: [[0, 2], [31, 35], [64, 66]],
        text: { before: "", left: digits.slice(0, 4), right: digits.slice(4), after: "" },
      },
    };
  }

  // A UPC-A is an EAN-13 that starts with a zero.
  const full = digits.length === 12 ? `0${digits}` : digits;
  const parity = PARITY[Number(full[0])] ?? "LLLLLL";
  const left = full
    .slice(1, 7)
    .split("")
    .map((digit, index) => draw(parity[index] === "G" ? G : L, digit))
    .join("");
  const right = full
    .slice(7)
    .split("")
    .map((digit) => draw(R, digit))
    .join("");
  return {
    ok: true,
    code: {
      format: digits.length === 12 ? "UPC-A" : "EAN-13",
      digits,
      modules: START + left + MIDDLE + right + END,
      guards: [[0, 2], [45, 49], [92, 94]],
      text: digits.length === 12 ? { before: digits.slice(0, 1), left: digits.slice(1, 6), right: digits.slice(6, 11), after: digits.slice(11) } : { before: digits.slice(0, 1), left: digits.slice(1, 7), right: digits.slice(7), after: "" },
    },
  };
}
