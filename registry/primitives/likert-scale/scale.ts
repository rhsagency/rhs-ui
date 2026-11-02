/** What a Likert scale holds: the number of the chosen point (1 is the first), "na" for the Not applicable choice, or null while nothing is chosen. */
export type LikertValue = number | "na" | null;

/** The value Radix and the form carry for the Not applicable choice. */
export const NOT_APPLICABLE = "na";

const FIVE = ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"] as const;
const SEVEN = ["Strongly disagree", "Disagree", "Somewhat disagree", "Neutral", "Somewhat agree", "Agree", "Strongly agree"] as const;

/** The labels of an agreement scale of five or seven points, from Strongly disagree to Strongly agree. */
export const agreementOptions = (points: 5 | 7): readonly string[] => (points === 7 ? SEVEN : FIVE);

/** A value as the string a radio carries. */
export const toRadio = (value: LikertValue): string => (value === null ? "" : String(value));

/** A radio's string as a value: "3" is 3, "na" stays "na", and anything else is no choice. */
export function fromRadio(text: string): LikertValue {
  if (text === NOT_APPLICABLE) return NOT_APPLICABLE;
  const point = Number(text);
  return Number.isInteger(point) && point > 0 ? point : null;
}
