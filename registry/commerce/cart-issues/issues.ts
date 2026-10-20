/** What went wrong in a cart. */
export type CartIssueType = "unavailable" | "quantity" | "price" | "minimum";

export interface CartIssue {
  /** Identity of the issue, for your list's key. */
  id: string;
  /** What kind of problem it is: it picks the icon and, unless you say otherwise, whether it blocks checkout. */
  type: CartIssueType;
  /** The product the issue is about: "Linen shirt, M". Leave it out for an issue about the whole cart, like a minimum order. */
  line?: string;
  /** What happened, in plain words: "Sold out since you added it." */
  message: string;
  /** The one action that resolves it: "Remove", "Update to 2", "Accept new price". Without one the issue is information only. */
  fix?: string;
  /** Whether it stops checkout. A price change does not unless you say so; everything else does. */
  blocking?: boolean;
}

/** Whether an issue stops checkout. */
export function isBlocking(issue: CartIssue): boolean {
  return issue.blocking ?? issue.type !== "price";
}

export interface CartIssuesSummary {
  /** How many issues there are. */
  count: number;
  /** How many of them stop checkout. */
  blocking: number;
  /** A sentence for why checkout is disabled, or null when nothing blocks: "Fix 2 problems to check out." */
  reason: string | null;
}

/**
 * For the checkout button: how many issues there are, how many block, and the
 * reason to show next to a disabled button. Works on the server too, so a page
 * can render the button already disabled.
 */
export function summarizeCartIssues(issues: readonly CartIssue[]): CartIssuesSummary {
  const blocking = issues.filter(isBlocking).length;
  return { count: issues.length, blocking, reason: blocking > 0 ? `Fix ${blocking} ${blocking === 1 ? "problem" : "problems"} to check out.` : null };
}
