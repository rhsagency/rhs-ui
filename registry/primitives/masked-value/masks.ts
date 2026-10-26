/** The ready-made masks: what each one keeps of the value and what it hides. */
export type MaskPreset = "card" | "email" | "phone" | "iban" | "full";

/** Your own mask: the real value in, the text to show while it is hidden out. */
export type MaskFunction = (value: string) => string;

const DOT = "•";
const dots = (count: number) => DOT.repeat(Math.max(0, count));

/** Too short to show any of it: nothing is kept, and the length is not given away. */
const nothing = () => dots(8);

/** "4242 4242 4242 4242" -> "•••• 4242". */
function card(value: string): string {
  const digits = value.replace(/\D/g, "");
  return digits.length < 8 ? nothing() : `${dots(4)} ${digits.slice(-4)}`;
}

/** "jane.doe@example.com" -> "j•••@example.com". The domain stays, the length of the name does not show. */
function email(value: string): string {
  const at = value.lastIndexOf("@");
  if (at < 1 || at === value.length - 1) return nothing();
  const first = Array.from(value.slice(0, at))[0] ?? "";
  return `${first}${dots(3)}${value.slice(at)}`;
}

/** "+31 6 1234 5678" -> "+31 ••• ••• 5678". A country code that is set apart by a space stays. */
function phone(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 7) return nothing();
  const lead = /^\+\d{1,3}(?=\s)/.exec(value.trim())?.[0];
  return `${lead ? `${lead} ` : ""}${dots(3)} ${dots(3)} ${digits.slice(-4)}`;
}

/** "NL91 ABNA 0417 1643 00" -> "NL91 •••• •••• ••43 00": the country and check digits and the last four characters, in the usual groups of four. */
function iban(value: string): string {
  const chars = Array.from(value.replace(/\s+/g, "").toUpperCase());
  if (chars.length < 12) return nothing();
  const kept = chars.map((char, index) => (index < 4 || index >= chars.length - 4 ? char : DOT));
  return (kept.join("").match(/.{1,4}/g) ?? []).join(" ");
}

const PRESETS: Record<MaskPreset, MaskFunction> = { card, email, phone, iban, full: nothing };

/** What each preset calls the value, for the name of the button: "Show email". */
export const MASK_LABELS: Record<MaskPreset, string> = { card: "card number", email: "email", phone: "phone number", iban: "IBAN", full: "value" };

/** The text to show for `value` while it is hidden. */
export function maskValue(value: string, mask: MaskPreset | MaskFunction): string {
  return typeof mask === "function" ? mask(value) : PRESETS[mask](value);
}
