/**
 * A QR code encoder in plain TypeScript, no dependencies and no network: text
 * in, a square of dark and light modules out. It picks the smallest version
 * (1 to 40) that holds the text at the chosen error correction level, encodes
 * in the densest mode the text allows (digits, then letters and a few symbols
 * in capitals, then UTF-8 bytes), adds Reed-Solomon error correction, lays the
 * modules out, and keeps the mask with the lowest penalty. It follows
 * ISO/IEC 18004.
 */

/** How much of the code may be lost and still be read: about 7, 15, 25 and 30 percent. */
export type QrLevel = "L" | "M" | "Q" | "H";

/** The encoded code. `modules[y][x]` is true for a dark module. */
export interface QrMatrix {
  /** The version, 1 to 40. A version is `4 * version + 17` modules wide. */
  version: number;
  /** The width and height in modules. */
  size: number;
  /** The level it was encoded at. */
  level: QrLevel;
  /** The mask that was chosen, 0 to 7. */
  mask: number;
  /** The modules, row by row. */
  modules: boolean[][];
}

const LEVEL_BITS: Record<QrLevel, number> = { L: 1, M: 0, Q: 3, H: 2 };

/** Error correction codewords in each block, by level and then version (index 0 is unused). */
const ECC_PER_BLOCK: Record<QrLevel, readonly number[]> = {
  L: [-1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
  M: [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],
  Q: [-1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
  H: [-1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
};

/** The number of blocks the codewords are split into, by level and then version. */
const BLOCKS: Record<QrLevel, readonly number[]> = {
  L: [-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25],
  M: [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49],
  Q: [-1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68],
  H: [-1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81],
};

const ALPHANUMERIC = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:";

type Mode = "numeric" | "alphanumeric" | "byte";
const MODE_BITS: Record<Mode, number> = { numeric: 1, alphanumeric: 2, byte: 4 };
/** Bits of the character count, for versions 1 to 9, 10 to 26 and 27 to 40. */
const COUNT_BITS: Record<Mode, readonly [number, number, number]> = { numeric: [10, 12, 14], alphanumeric: [9, 11, 13], byte: [8, 16, 16] };

/** The modules a version has room for data in, before error correction takes its share. */
function rawModules(version: number): number {
  let modules = (16 * version + 128) * version + 64;
  if (version >= 2) {
    const patterns = Math.floor(version / 7) + 2;
    modules -= (25 * patterns - 10) * patterns - 55;
    if (version >= 7) modules -= 36;
  }
  return modules;
}

/** How many bytes of data a version holds at a level, once the error correction codewords are taken out. */
function dataCodewords(version: number, level: QrLevel): number {
  return Math.floor(rawModules(version) / 8) - (ECC_PER_BLOCK[level][version] ?? 0) * (BLOCKS[level][version] ?? 0);
}

/** The densest mode the text fits in. */
function modeOf(text: string): Mode {
  if (/^[0-9]*$/.test(text)) return "numeric";
  if ([...text].every((char) => ALPHANUMERIC.includes(char))) return "alphanumeric";
  return "byte";
}

/** The data bits of a text in a mode, and how many characters (or bytes) the count field has to say. */
function dataBits(text: string, mode: Mode): { bits: number[]; count: number } {
  const bits: number[] = [];
  const push = (value: number, length: number): void => {
    for (let shift = length - 1; shift >= 0; shift -= 1) bits.push((value >>> shift) & 1);
  };
  if (mode === "numeric") {
    for (let at = 0; at < text.length; at += 3) {
      const group = text.slice(at, at + 3);
      push(Number.parseInt(group, 10), group.length * 3 + 1);
    }
    return { bits, count: text.length };
  }
  if (mode === "alphanumeric") {
    for (let at = 0; at + 1 < text.length; at += 2) push(ALPHANUMERIC.indexOf(text.charAt(at)) * 45 + ALPHANUMERIC.indexOf(text.charAt(at + 1)), 11);
    if (text.length % 2 === 1) push(ALPHANUMERIC.indexOf(text.charAt(text.length - 1)), 6);
    return { bits, count: text.length };
  }
  const bytes = new TextEncoder().encode(text);
  for (const byte of bytes) push(byte, 8);
  return { bits, count: bytes.length };
}

/* Reed-Solomon over GF(256) with the polynomial 0x11D. */

function multiply(a: number, b: number): number {
  let product = 0;
  for (let bit = 7; bit >= 0; bit -= 1) {
    product = (product << 1) ^ ((product >>> 7) * 0x11d);
    product ^= ((b >>> bit) & 1) * a;
  }
  return product;
}

function divisorOf(degree: number): number[] {
  const divisor = Array.from({ length: degree }, () => 0);
  divisor[degree - 1] = 1;
  let root = 1;
  for (let step = 0; step < degree; step += 1) {
    for (let at = 0; at < degree; at += 1) {
      divisor[at] = multiply(divisor[at] ?? 0, root);
      if (at + 1 < degree) divisor[at] = (divisor[at] ?? 0) ^ (divisor[at + 1] ?? 0);
    }
    root = multiply(root, 2);
  }
  return divisor;
}

function remainderOf(data: readonly number[], divisor: readonly number[]): number[] {
  const rest = divisor.map(() => 0);
  for (const byte of data) {
    const factor = byte ^ (rest.shift() ?? 0);
    rest.push(0);
    divisor.forEach((coefficient, at) => {
      rest[at] = (rest[at] ?? 0) ^ multiply(coefficient, factor);
    });
  }
  return rest;
}

/** Split the data into blocks, add each block's error correction, and interleave them. */
function withEcc(data: readonly number[], version: number, level: QrLevel): number[] {
  const blocks = BLOCKS[level][version] ?? 1;
  const eccLength = ECC_PER_BLOCK[level][version] ?? 0;
  const total = Math.floor(rawModules(version) / 8);
  const shortBlocks = blocks - (total % blocks);
  const shortLength = Math.floor(total / blocks);
  const divisor = divisorOf(eccLength);
  const parts: number[][] = [];
  for (let block = 0, taken = 0; block < blocks; block += 1) {
    const chunk = data.slice(taken, taken + shortLength - eccLength + (block < shortBlocks ? 0 : 1));
    taken += chunk.length;
    const ecc = remainderOf(chunk, divisor);
    parts.push([...chunk, ...(block < shortBlocks ? [0] : []), ...ecc]);
  }
  const out: number[] = [];
  for (let at = 0; at < (parts[0]?.length ?? 0); at += 1) {
    parts.forEach((part, block) => {
      // A short block has one data codeword fewer: its padding slot is skipped.
      if (at !== shortLength - eccLength || block >= shortBlocks) out.push(part[at] ?? 0);
    });
  }
  return out;
}

/** The centres of the alignment patterns along one axis. */
function alignmentCentres(version: number): number[] {
  if (version === 1) return [];
  const count = Math.floor(version / 7) + 2;
  const size = version * 4 + 17;
  const step = version === 32 ? 26 : Math.ceil((version * 4 + 4) / (count * 2 - 2)) * 2;
  const centres = [6];
  for (let at = size - 7; centres.length < count; at -= step) centres.splice(1, 0, at);
  return centres;
}

/** The 15 bits that say the level and the mask, with their own error correction. */
function formatBits(level: QrLevel, mask: number): number {
  const data = (LEVEL_BITS[level] << 3) | mask;
  let rest = data;
  for (let step = 0; step < 10; step += 1) rest = (rest << 1) ^ ((rest >>> 9) * 0x537);
  return ((data << 10) | rest) ^ 0x5412;
}

/** The 18 bits that say the version, for versions 7 and up. */
function versionBits(version: number): number {
  let rest = version;
  for (let step = 0; step < 12; step += 1) rest = (rest << 1) ^ ((rest >>> 11) * 0x1f25);
  return (version << 12) | rest;
}

const MASKS: readonly ((x: number, y: number) => boolean)[] = [
  (x, y) => (x + y) % 2 === 0,
  (_x, y) => y % 2 === 0,
  (x) => x % 3 === 0,
  (x, y) => (x + y) % 3 === 0,
  (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0,
  (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
  (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
  (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
];

/** How badly a pattern of modules would confuse a scanner: runs, blocks, look-alikes of the finder pattern, and an unbalanced mix. */
function penaltyOf(modules: readonly (readonly boolean[])[]): number {
  const size = modules.length;
  const at = (x: number, y: number): boolean => modules[y]?.[x] ?? false;
  let penalty = 0;
  // Runs of five or more of one colour, and look-alikes of the finder pattern (1:1:3:1:1) with four light modules beside it, along every row and column.
  // The edge of the code counts as light: each line is read with four light modules before and after it.
  for (const vertical of [false, true]) {
    for (let line = 0; line < size; line += 1) {
      let run = 0;
      let last = false;
      let window = 0;
      for (let index = 0; index < size + 8; index += 1) {
        const real = index >= 4 && index < size + 4;
        const dark = real && (vertical ? at(line, index - 4) : at(index - 4, line));
        window = ((window << 1) | (dark ? 1 : 0)) & 0x7ff;
        if (index >= 10 && (window === 0b10111010000 || window === 0b00001011101)) penalty += 40;
        if (!real) continue;
        if (index > 4 && dark === last) {
          run += 1;
          if (run === 5) penalty += 3;
          else if (run > 5) penalty += 1;
        } else run = 1;
        last = dark;
      }
    }
  }
  // Blocks of 2 by 2 in one colour.
  for (let y = 0; y + 1 < size; y += 1) {
    for (let x = 0; x + 1 < size; x += 1) {
      const colour = at(x, y);
      if (colour === at(x + 1, y) && colour === at(x, y + 1) && colour === at(x + 1, y + 1)) penalty += 3;
    }
  }
  // More dark than light, or the other way round.
  let dark = 0;
  for (const row of modules) for (const module of row) if (module) dark += 1;
  const total = size * size;
  penalty += (Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1) * 10;
  return penalty;
}

/**
 * Encode `text` as a QR code at an error correction level (default "M"). The
 * text can be anything, in any script: it is sent as UTF-8. Throws a
 * `RangeError` when it does not fit even in version 40, which holds 7089
 * digits, 4296 letters or 2953 bytes at level L.
 */
export function encodeQr(text: string, level: QrLevel = "M"): QrMatrix {
  const mode = modeOf(text);
  const { bits: body, count } = dataBits(text, mode);
  let version = 1;
  while (version <= 40 && 4 + COUNT_BITS[mode][version <= 9 ? 0 : version <= 26 ? 1 : 2] + body.length > dataCodewords(version, level) * 8) version += 1;
  if (version > 40) throw new RangeError("That is too much data for a QR code. Shorten it, or use a lower error correction level.");

  // The bit stream: mode, count, data, a terminator, padding to whole bytes, and then the two pad bytes in turn.
  const bits: number[] = [];
  const push = (value: number, length: number): void => {
    for (let shift = length - 1; shift >= 0; shift -= 1) bits.push((value >>> shift) & 1);
  };
  push(MODE_BITS[mode], 4);
  push(count, COUNT_BITS[mode][version <= 9 ? 0 : version <= 26 ? 1 : 2]);
  bits.push(...body);
  const capacity = dataCodewords(version, level) * 8;
  push(0, Math.min(4, capacity - bits.length));
  push(0, (8 - (bits.length % 8)) % 8);
  const data: number[] = [];
  for (let at = 0; at < bits.length; at += 8) data.push(bits.slice(at, at + 8).reduce((byte, bit) => (byte << 1) | bit, 0));
  for (let pad = 0xec; data.length < capacity / 8; pad ^= 0xec ^ 0x11) data.push(pad);
  const codewords = withEcc(data, version, level);

  const size = version * 4 + 17;
  const modules = Array.from({ length: size }, () => Array.from({ length: size }, () => false));
  const reserved = Array.from({ length: size }, () => Array.from({ length: size }, () => false));
  const put = (x: number, y: number, dark: boolean): void => {
    const row = modules[y];
    const lock = reserved[y];
    if (row && lock) {
      row[x] = dark;
      lock[x] = true;
    }
  };

  // The timing patterns, then the three finder patterns with their quiet edge, then the alignment patterns.
  for (let at = 0; at < size; at += 1) {
    put(6, at, at % 2 === 0);
    put(at, 6, at % 2 === 0);
  }
  for (const [cx, cy] of [
    [3, 3],
    [size - 4, 3],
    [3, size - 4],
  ] as const) {
    for (let dy = -4; dy <= 4; dy += 1) {
      for (let dx = -4; dx <= 4; dx += 1) {
        const distance = Math.max(Math.abs(dx), Math.abs(dy));
        const x = cx + dx;
        const y = cy + dy;
        if (x >= 0 && x < size && y >= 0 && y < size) put(x, y, distance !== 2 && distance !== 4);
      }
    }
  }
  const centres = alignmentCentres(version);
  centres.forEach((cy, row) => {
    centres.forEach((cx, column) => {
      const onFinder = (row === 0 && column === 0) || (row === 0 && column === centres.length - 1) || (row === centres.length - 1 && column === 0);
      if (onFinder) return;
      for (let dy = -2; dy <= 2; dy += 1) for (let dx = -2; dx <= 2; dx += 1) put(cx + dx, cy + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
    });
  });

  // Where the format and version bits go is reserved now and written for real once the mask is known.
  const drawFormat = (mask: number): void => {
    const word = formatBits(level, mask);
    const bit = (index: number): boolean => ((word >>> index) & 1) === 1;
    for (let index = 0; index <= 5; index += 1) put(8, index, bit(index));
    put(8, 7, bit(6));
    put(8, 8, bit(7));
    put(7, 8, bit(8));
    for (let index = 9; index < 15; index += 1) put(14 - index, 8, bit(index));
    for (let index = 0; index < 8; index += 1) put(size - 1 - index, 8, bit(index));
    for (let index = 8; index < 15; index += 1) put(8, size - 15 + index, bit(index));
    put(8, size - 8, true);
  };
  drawFormat(0);
  if (version >= 7) {
    const word = versionBits(version);
    for (let index = 0; index < 18; index += 1) {
      const dark = ((word >>> index) & 1) === 1;
      const a = size - 11 + (index % 3);
      const b = Math.floor(index / 3);
      put(a, b, dark);
      put(b, a, dark);
    }
  }

  // The codewords, two columns at a time, from the bottom right, up and then down, skipping the vertical timing pattern.
  let bit = 0;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let step = 0; step < size; step += 1) {
      for (let side = 0; side < 2; side += 1) {
        const x = right - side;
        const y = ((right + 1) & 2) === 0 ? size - 1 - step : step;
        if (reserved[y]?.[x] || bit >= codewords.length * 8) continue;
        const row = modules[y];
        if (row) row[x] = (((codewords[bit >>> 3] ?? 0) >>> (7 - (bit & 7))) & 1) === 1;
        bit += 1;
      }
    }
  }

  // Try each of the eight masks and keep the one a scanner would find easiest.
  const flip = (mask: number): void => {
    const rule = MASKS[mask];
    if (!rule) return;
    for (let y = 0; y < size; y += 1) {
      const row = modules[y];
      if (!row) continue;
      for (let x = 0; x < size; x += 1) if (!reserved[y]?.[x] && rule(x, y)) row[x] = !row[x];
    }
  };
  let best = 0;
  let lowest = Number.POSITIVE_INFINITY;
  for (let mask = 0; mask < 8; mask += 1) {
    flip(mask);
    drawFormat(mask);
    const penalty = penaltyOf(modules);
    if (penalty < lowest) {
      lowest = penalty;
      best = mask;
    }
    flip(mask);
  }
  flip(best);
  drawFormat(best);
  return { version, size, level, mask: best, modules };
}

/** The dark modules as the data of one SVG path, a module being one unit and the code starting `margin` units in. Neighbouring modules in a row are one rectangle. */
export function qrPath(matrix: QrMatrix, margin: number): string {
  let path = "";
  matrix.modules.forEach((row, y) => {
    for (let x = 0; x < matrix.size; x += 1) {
      if (!row[x]) continue;
      let end = x;
      while (row[end + 1]) end += 1;
      path += `M${x + margin} ${y + margin}h${end - x + 1}v1h-${end - x + 1}z`;
      x = end;
    }
  });
  return path;
}

/** A whole SVG document of the code, dark modules on a white square, for saving as a file. */
export function qrSvg(matrix: QrMatrix, margin: number, pixels?: number): string {
  const side = matrix.size + margin * 2;
  const dimensions = pixels ? ` width="${pixels}" height="${pixels}"` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${side} ${side}"${dimensions} shape-rendering="crispEdges"><rect width="${side}" height="${side}" fill="#fff"/><path d="${qrPath(matrix, margin)}" fill="#000"/></svg>`;
}

/** What the code is called for a screen reader: "QR code for acme.com/invite". A URL loses its scheme and a trailing slash; long text is shortened. */
export function qrName(value: string, title?: string): string {
  const named = (title ?? value.replace(/^[a-z][a-z0-9+.-]*:\/\//i, "").replace(/\/$/, "")).trim();
  return `QR code for ${named.length > 60 ? `${named.slice(0, 57)}...` : named}`;
}
