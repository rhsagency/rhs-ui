/**
 * The words and the small decisions behind EnvironmentSwitcher, as plain
 * functions: they hold no state and call no hook, so a Server Component can
 * use them too.
 */

/** What an environment is for. It decides the mark that is drawn and what is asked before moving to it. */
export type EnvironmentKind = "development" | "preview" | "staging" | "production";

/** One place the tool can run against. */
export interface Environment {
  /** A stable identity from your own records: "prod". `value` and `onValueChange` use it. Unique within the list. */
  id: string;
  /** What people call it: "Production". */
  name: string;
  /** A line about it under the name in the list: "Real customers and real money". */
  description?: string;
  /** What kind it is. `production` is drawn as live: a filled mark and an inverted label with the word "Live". */
  kind: EnvironmentKind;
  /** What changes when someone moves here, in a sentence, shown in the confirmation. Without one a general sentence is used. */
  consequence?: string;
}

/** The words the switcher says, for translation. `{name}` and `{from}` are filled in. */
export interface EnvironmentSwitcherLabels {
  /** The small heading over the list. Default "Environment". */
  heading?: string;
  /** Said to a screen reader before the name on the button. Default "Environment:". */
  buttonPrefix?: string;
  /** The inverted label on a production environment. Default "Live". */
  live?: string;
  /** The title of the confirmation. Default "Switch to {name}?". */
  confirmTitle?: string;
  /** Names where from and where to. Default "You are moving from {from} to {name}.". */
  confirmMove?: string;
  /** What changes, when the environment has no `consequence` of its own. Default "Anything you run or change from now on happens in {name}.". */
  consequence?: string;
  /** The same for a production environment. Default "{name} is live. What you run or change from now on reaches real customers straight away.". */
  consequenceLive?: string;
  /** The button that stays where it is. Default "Cancel". */
  cancel?: string;
  /** The button that goes. Default "Switch to {name}". */
  confirm?: string;
}

export const DEFAULT_LABELS = {
  heading: "Environment",
  buttonPrefix: "Environment:",
  live: "Live",
  confirmTitle: "Switch to {name}?",
  confirmMove: "You are moving from {from} to {name}.",
  consequence: "Anything you run or change from now on happens in {name}.",
  consequenceLive: "{name} is live. What you run or change from now on reaches real customers straight away.",
  cancel: "Cancel",
  confirm: "Switch to {name}",
} satisfies Required<EnvironmentSwitcherLabels>;

/** Fills `{name}` marks in a sentence. A mark with no value stays as it is. */
export function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (mark, key: string) => (key in values ? (values[key] ?? mark) : mark));
}

/** Whether the environment is the live one: the kind whose mark and label can never be mistaken. */
export const isLive = (environment: Environment): boolean => environment.kind === "production";

/** What the confirmation says changes: the environment's own sentence, or a general one. */
export function consequenceOf(environment: Environment, text: Required<EnvironmentSwitcherLabels>): string {
  return environment.consequence ?? fill(isLive(environment) ? text.consequenceLive : text.consequence, { name: environment.name });
}
