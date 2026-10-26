/**
 * The two encoders behind Barcode, as plain functions: no React, no DOM, so a
 * Server Component, a script that prints labels or a form that validates a
 * scan can use them too.
 */

export type BarcodeFormat = "code128" | "ean13";

export type BarcodeEncoding =
  | {
      valid: true;
      format: BarcodeFormat;
      /** What is printed under the bars. EAN-13 always has all thirteen digits, with the check digit. */
      text: string;
      /** Widths in modules, alternating bar, space, bar... and starting (and ending) with a bar. */
      runs: readonly number[];
      /** The width of all runs together, in modules. The quiet zone is not part of it. */
      modules: number;
      /** Module ranges [from, to) of the bars that run longer than the rest: the guard bars of an EAN-13. */
      guards: readonly (readonly [number, number])[];
    }
  | {
      valid: false;
      format: BarcodeFormat;
      /** One sentence that says what is wrong with the value, in words someone can act on. */
      reason: string;
    };

/**
 * Code 128 symbols as bar and space widths in modules. Values 0 to 105 are six
 * widths that add up to 11 modules; the stop pattern (106) is seven widths, 13
 * modules. Every pattern starts with a bar.
 */
const CODE128: readonly string[] = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213",
  "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132",
  "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211",
  "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313",
  "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331",
  "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111",
  "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214",
  "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111",
  "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141",
  "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113", "411311", "113141",
  "114131", "311141", "411131", "211412", "211214", "211232", "2331112",
];

const START = { A: 103, B: 104, C: 105 } as const;
const STOP = 106;
const CODE_A = 101;
const CODE_B = 100;
const CODE_C = 99;
const SHIFT = 98;

/** The three code sets, in the order a tie is settled: B is by far the most common. */
type CodeSet = "B" | "A" | "C";
const SETS: readonly CodeSet[] = ["B", "A", "C"];

const isDigit = (code: number) => code >= 48 && code <= 57;
/** Set A holds the control characters and the capitals (0 to 95). */
const inA = (code: number) => code <= 95;
/** Set B holds the printable characters and the lower case (32 to 127). */
const inB = (code: number) => code >= 32;
const valueA = (code: number) => (code < 32 ? code + 64 : code - 32);
const valueB = (code: number) => code - 32;

const SWITCH: Record<CodeSet, Partial<Record<CodeSet, number>>> = {
  A: { B: CODE_B, C: CODE_C },
  B: { A: CODE_A, C: CODE_C },
  C: { A: CODE_A, B: CODE_B },
};

interface Step {
  /** Symbols written for this step, without the code that gets the set there. */
  symbols: number[];
  /** How many characters it consumed. */
  take: number;
  /** The set after the step. */
  set: CodeSet;
}

/**
 * The shortest Code 128 that holds the text. A dynamic program over (position,
 * set): per position it weighs one character in the current set, a pair of
 * digits in set C, a one-character shift between A and B, and a switch of set.
 * Long runs of digits end up in C, two to a symbol; capitals, lower case and
 * control characters move between A and B only where that is shorter.
 */
function code128Symbols(codes: readonly number[]): number[] {
  const n = codes.length;
  const INF = Number.POSITIVE_INFINITY;
  // consume[i][s]: the cheapest way to finish from position i in set s when the next move writes a character.
  const consume: Record<CodeSet, number[]> = { A: Array(n + 1).fill(INF), B: Array(n + 1).fill(INF), C: Array(n + 1).fill(INF) };
  const best: Record<CodeSet, number[]> = { A: Array(n + 1).fill(INF), B: Array(n + 1).fill(INF), C: Array(n + 1).fill(INF) };
  const pick: Record<CodeSet, (Step | null)[]> = { A: Array(n + 1).fill(null), B: Array(n + 1).fill(null), C: Array(n + 1).fill(null) };
  const switchTo: Record<CodeSet, (CodeSet | null)[]> = { A: Array(n + 1).fill(null), B: Array(n + 1).fill(null), C: Array(n + 1).fill(null) };
  for (const s of SETS) {
    consume[s][n] = 0;
    best[s][n] = 0;
  }
  for (let i = n - 1; i >= 0; i--) {
    const code = codes[i] as number;
    const next = codes[i + 1];
    for (const s of SETS) {
      let cost = INF;
      let step: Step | null = null;
      const offer = (extra: number, move: Step) => {
        const total = extra + best[move.set][i + move.take]!;
        if (total < cost) {
          cost = total;
          step = move;
        }
      };
      if (s === "A" && inA(code)) offer(1, { symbols: [valueA(code)], take: 1, set: "A" });
      if (s === "B" && inB(code)) offer(1, { symbols: [valueB(code)], take: 1, set: "B" });
      if (s === "C" && isDigit(code) && next !== undefined && isDigit(next)) offer(1, { symbols: [(code - 48) * 10 + (next - 48)], take: 2, set: "C" });
      // A shift costs one symbol for the shift and one for the character, and the set stays.
      if (s === "A" && !inA(code) && inB(code)) offer(2, { symbols: [SHIFT, valueB(code)], take: 1, set: "A" });
      if (s === "B" && !inB(code) && inA(code)) offer(2, { symbols: [SHIFT, valueA(code)], take: 1, set: "B" });
      consume[s][i] = cost;
      pick[s][i] = step;
    }
    for (const s of SETS) {
      best[s][i] = consume[s][i]!;
      for (const t of SETS) {
        if (t === s) continue;
        const viaSwitch = 1 + consume[t][i]!;
        if (viaSwitch < best[s][i]!) {
          best[s][i] = viaSwitch;
          switchTo[s][i] = t;
        }
      }
    }
  }

  // The start symbol picks the set, and nothing is written before it, so only `consume` counts at position 0.
  let start: CodeSet = "B";
  for (const s of SETS) if (consume[s][0]! < consume[start][0]!) start = s;
  const out: number[] = [START[start]];
  let set: CodeSet = start;
  let i = 0;
  let afterSwitch = true;
  while (i < n) {
    const stay = consume[set][i]!;
    const away = switchTo[set][i];
    if (!afterSwitch && away && best[set][i]! < stay) {
      out.push(SWITCH[set][away] as number);
      set = away;
      afterSwitch = true;
      continue;
    }
    const step = pick[set][i] as Step;
    out.push(...step.symbols);
    i += step.take;
    set = step.set;
    afterSwitch = false;
  }
  return out;
}

function encodeCode128(value: string): BarcodeEncoding {
  const invalid = (reason: string): BarcodeEncoding => ({ valid: false, format: "code128", reason });
  if (value.length === 0) return invalid("There is nothing to encode: the value is empty.");
  const codes: number[] = [];
  for (const char of value) {
    const code = char.codePointAt(0) as number;
    if (code > 127) return invalid(`Code 128 holds ASCII only, and "${char}" is not ASCII.`);
    codes.push(code);
  }
  const symbols = code128Symbols(codes);
  // The check symbol: the start value plus every later symbol times its position, modulo 103.
  const check = symbols.reduce((sum, symbol, index) => sum + symbol * Math.max(1, index), 0) % 103;
  const all = [...symbols, check, STOP];
  const runs = all.flatMap((symbol) => Array.from(CODE128[symbol] as string, Number));
  return { valid: true, format: "code128", text: value, runs, modules: runs.reduce((sum, run) => sum + run, 0), guards: [] };
}

/** Left-hand digits, odd parity (L). The right-hand set is its complement and the even set is the right-hand set reversed. */
const EAN_L = ["0001101", "0011001", "0010011", "0111101", "0100011", "0110001", "0101111", "0111011", "0110111", "0001011"] as const;
const EAN_R = EAN_L.map((code) => Array.from(code, (bit) => (bit === "0" ? "1" : "0")).join(""));
const EAN_G = EAN_R.map((code) => Array.from(code).reverse().join(""));
/** Which of L and G the six left-hand digits use, by the first digit. */
const EAN_PARITY = ["LLLLLL", "LLGLGG", "LLGGLG", "LLGGGL", "LGLLGG", "LGGLLG", "LGGGLL", "LGLGLG", "LGLGGL", "LGGLGL"] as const;

/** The check digit of the first twelve digits of an EAN-13 (or the first seven, eleven... of any GTIN, counted from the right). */
export function eanCheckDigit(digits: string): number {
  let sum = 0;
  for (let index = 0; index < digits.length; index++) {
    // From the right, the first digit before the check digit weighs 3, the next 1, and so on.
    sum += Number(digits[digits.length - 1 - index]) * (index % 2 === 0 ? 3 : 1);
  }
  return (10 - (sum % 10)) % 10;
}

function encodeEan13(value: string): BarcodeEncoding {
  const invalid = (reason: string): BarcodeEncoding => ({ valid: false, format: "ean13", reason });
  const digits = value.replace(/[\s-]/g, "");
  if (digits.length === 0) return invalid("There is nothing to encode: the value is empty.");
  if (!/^\d+$/.test(digits)) return invalid("An EAN-13 is digits only.");
  if (digits.length !== 12 && digits.length !== 13) return invalid(`An EAN-13 has 12 digits plus a check digit, and this has ${digits.length}.`);
  const expected = eanCheckDigit(digits.slice(0, 12));
  if (digits.length === 13 && Number(digits[12]) !== expected) {
    return invalid(`The check digit of ${digits} should be ${expected}, not ${digits[12]}.`);
  }
  const full = `${digits.slice(0, 12)}${expected}`;
  const parity = EAN_PARITY[Number(full[0])] as string;
  let bits = "101";
  for (let index = 1; index <= 6; index++) {
    const digit = Number(full[index]);
    bits += parity[index - 1] === "L" ? EAN_L[digit] : EAN_G[digit];
  }
  bits += "01010";
  for (let index = 7; index <= 12; index++) bits += EAN_R[Number(full[index])];
  bits += "101";

  const runs: number[] = [];
  for (let index = 0; index < bits.length; ) {
    let end = index;
    while (end < bits.length && bits[end] === bits[index]) end++;
    runs.push(end - index);
    index = end;
  }
  return { valid: true, format: "ean13", text: full, runs, modules: bits.length, guards: [[0, 3], [45, 50], [92, 95]] };
}

/**
 * Encodes a value, or says why it cannot be encoded. Code 128 takes any ASCII
 * text and chooses the code sets itself. EAN-13 takes twelve digits and adds
 * the check digit, or thirteen and checks it; spaces and hyphens are ignored.
 */
export function encodeBarcode(value: string, format: BarcodeFormat = "code128"): BarcodeEncoding {
  return format === "ean13" ? encodeEan13(value) : encodeCode128(value);
}
