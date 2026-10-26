/**
 * The providers most addresses end in. A typo in one of these is a lost
 * signup, so they are what a domain is compared with. The list is a prop of
 * EmailField: swap in the domains your own users have.
 */
export const DEFAULT_EMAIL_DOMAINS: readonly string[] = [
  "gmail.com",
  "googlemail.com",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "msn.com",
  "yahoo.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "aol.com",
  "proton.me",
  "protonmail.com",
  "pm.me",
  "gmx.com",
  "gmx.net",
  "gmx.de",
  "web.de",
  "t-online.de",
  "hotmail.de",
  "yahoo.de",
  "zoho.com",
  "hey.com",
  "fastmail.com",
  "mail.com",
  "hotmail.nl",
  "live.nl",
  "outlook.nl",
  "ziggo.nl",
  "kpnmail.nl",
  "planet.nl",
  "hotmail.be",
  "live.be",
  "telenet.be",
  "skynet.be",
  "orange.fr",
  "free.fr",
  "wanadoo.fr",
  "hotmail.fr",
  "yahoo.fr",
  "hotmail.co.uk",
  "yahoo.co.uk",
  "btinternet.com",
  "sky.com",
];

/**
 * How many single-character edits turn one string into the other: an
 * insertion, a deletion, a changed character, or two neighbours swapped
 * (gmial is one edit away, not two). Use it for any "did you mean" of your own.
 */
export function editDistance(a: string, b: string): number {
  const x = [...a];
  const y = [...b];
  let beforePrevious: number[] = [];
  let previous: number[] = Array.from({ length: y.length + 1 }, (_, column) => column);
  for (let row = 1; row <= x.length; row += 1) {
    const current: number[] = [row];
    for (let column = 1; column <= y.length; column += 1) {
      const cost = x[row - 1] === y[column - 1] ? 0 : 1;
      let best = Math.min((previous[column] ?? 0) + 1, (current[column - 1] ?? 0) + 1, (previous[column - 1] ?? 0) + cost);
      if (row > 1 && column > 1 && x[row - 1] === y[column - 2] && x[row - 2] === y[column - 1]) best = Math.min(best, (beforePrevious[column - 2] ?? 0) + 1);
      current.push(best);
    }
    beforePrevious = previous;
    previous = current;
  }
  return previous[y.length] ?? 0;
}

/** The address as it will be used: surrounding spaces gone and the domain in lower case (the part before the @ is left as typed). */
export function normalizeEmail(value: string): string {
  const email = value.trim();
  const at = email.lastIndexOf("@");
  return at === -1 ? email : `${email.slice(0, at)}@${email.slice(at + 1).toLowerCase()}`;
}

const LABEL = "[\\p{L}\\p{N}](?:[\\p{L}\\p{N}-]*[\\p{L}\\p{N}])?";
const ADDRESS = new RegExp(`^[^\\s@]+@(?:${LABEL}\\.)+\\p{L}[\\p{L}\\p{N}-]*[\\p{L}\\p{N}]$`, "u");

/** What is wrong with an address, in a sentence, or null when it is well formed. An empty value is not an error here. */
export function describeEmail(value: string): string | null {
  const email = value.trim();
  if (!email) return null;
  if (/\s/.test(email)) return "Remove the spaces from the address.";
  const at = email.indexOf("@");
  if (at === -1) return "An address needs an @, like name@example.com.";
  if (email.indexOf("@", at + 1) !== -1) return "Use a single @ in the address.";
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  if (!local) return "Add the part before the @, like name@example.com.";
  if (!domain) return "Add the domain after the @, like name@example.com.";
  if (local.startsWith(".") || local.endsWith(".") || local.includes("..")) return "The part before the @ cannot start or end with a dot, or hold two in a row.";
  if (!domain.includes(".")) return "The domain needs an ending, like .com.";
  if (!ADDRESS.test(email)) return "That domain does not look right. Check what follows the @.";
  return null;
}

/** True for a complete, well-formed address. */
export function isValidEmail(value: string): boolean {
  return value.trim() !== "" && describeEmail(value) === null;
}

/**
 * The provider a domain was probably meant to be, or null. A known domain is
 * never "fixed". The name (gmail) and the ending (com) are compared apart: the
 * name may be one edit off (two once it is a long word), the ending one edit
 * off, and never more than two edits together. A short name (aol, msn) is
 * only ever fixed in its ending, because one edit apart is not a typo between
 * two three-letter names: bol.com is not aol.com. A missing dot (gmailcom) is
 * put back.
 */
export function closestDomain(domain: string, domains: readonly string[] = DEFAULT_EMAIL_DOMAINS): string | null {
  const typed = domain.trim().toLowerCase();
  if (!typed || domains.includes(typed)) return null;
  const [typedName = "", ...typedEnding] = typed.split(".");
  let best: string | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const candidate of domains) {
    const [name = "", ...ending] = candidate.split(".");
    let distance: number;
    if (typedEnding.length === 0) {
      distance = typed === candidate.replace(/\./g, "") ? 1 : Number.POSITIVE_INFINITY;
    } else {
      const nameDistance = editDistance(typedName, name);
      const endingDistance = editDistance(typedEnding.join("."), ending.join("."));
      const nameLimit = name.length <= 3 ? 0 : Math.min(typedName.length, name.length) >= 8 ? 2 : 1;
      distance = nameDistance <= nameLimit && endingDistance <= 1 && nameDistance + endingDistance <= 2 ? nameDistance + endingDistance : Number.POSITIVE_INFINITY;
    }
    if (distance < bestDistance) {
      best = candidate;
      bestDistance = distance;
    }
  }
  return best;
}

/** The whole address with a mistyped domain put right ("rick@gmial.com" gives "rick@gmail.com"), or null when there is nothing to offer. */
export function suggestEmail(value: string, domains: readonly string[] = DEFAULT_EMAIL_DOMAINS): string | null {
  const email = normalizeEmail(value);
  const at = email.lastIndexOf("@");
  if (at < 1 || /\s/.test(email) || email.indexOf("@") !== at) return null;
  const closest = closestDomain(email.slice(at + 1), domains);
  return closest ? `${email.slice(0, at)}@${closest}` : null;
}
