/**
 * The words behind MatchTimeline, as plain functions: they hold no state and
 * call no hook, so a Server Component can use them too.
 */

/** "{minute}" and friends in a template, filled in. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));
}
