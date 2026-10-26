/**
 * Calendar-day helpers of the booking bar. A day is a Date at midnight in the reader's own time zone, and every sum
 * goes through the year, the month and the day, never through milliseconds, so a change of clock never moves it.
 * They hold no hooks, so a Server Component can use them.
 */

export const startOfDay = (date: Date): Date => new Date(date.getFullYear(), date.getMonth(), date.getDate());
export const addDays = (date: Date, days: number): Date => new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
export const startOfMonth = (date: Date): Date => new Date(date.getFullYear(), date.getMonth(), 1);
/** The same day of another month, or the last day of it when it is shorter: 31 January + 1 month is 28 February. */
export const addMonths = (date: Date, months: number): Date => {
  const first = new Date(date.getFullYear(), date.getMonth() + months, 1);
  return new Date(first.getFullYear(), first.getMonth(), Math.min(date.getDate(), new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate()));
};
export const isSameDay = (a: Date, b: Date): boolean => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
/** A key for a day, to find its button: "2026-11-18" with the month counted from zero. */
export const dayKey = (date: Date): string => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
/** How many months a day is from year zero, so two months compare with one number. */
export const monthIndex = (date: Date): number => date.getFullYear() * 12 + date.getMonth();

/** Whole days from one day to another, however many hours a day had on the way (a change of clock has 23 or 25). */
export function daysBetween(from: Date, to: Date): number {
  return Math.round((Date.UTC(to.getFullYear(), to.getMonth(), to.getDate()) - Date.UTC(from.getFullYear(), from.getMonth(), from.getDate())) / 86_400_000);
}

/** A day from a Date, or from text: "2026-12-18" is that calendar day wherever it is read. */
export function parseDay(value: Date | string): Date {
  if (typeof value === "string") {
    const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
  }
  return startOfDay(new Date(value));
}

/** The weeks of a month, each seven slots long, with null where the week belongs to another month. */
export function monthWeeks(month: Date, weekStartsOn: 0 | 1): (Date | null)[][] {
  const first = startOfMonth(month);
  const lead = (first.getDay() - weekStartsOn + 7) % 7;
  const length = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const slots: (Date | null)[] = [...Array.from({ length: lead }, () => null), ...Array.from({ length }, (_, index) => addDays(first, index))];
  while (slots.length % 7 !== 0) slots.push(null);
  return Array.from({ length: slots.length / 7 }, (_, week) => slots.slice(week * 7, week * 7 + 7));
}
