"use client";

import { useState, type ReactNode } from "react";

import { IconGitCommit } from "@rhs-ui/icons";
import { BranchSwitcher, type RefKind } from "@rhs-ui/application/branch-switcher";
import { BranchPanel } from "@rhs-ui/application/branch-switcher/panel";
import { Badge } from "@rhs-ui/primitives/badge";
import { cn } from "@/lib/utils";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export default function Demo(): React.JSX.Element {
  const [branches, setBranches] = useState(BRANCHES);
  const [ref, setRef] = useState<{ name: string; kind: RefKind; fresh?: string }>({ name: "main", kind: "branch" });
  const [recent, setRecent] = useState(["feature/checkout-redesign", "release/2.4", "v2.3.2"]);
  const info = describe(ref.name, ref.kind, ref.fresh);

  function choose(name: string, kind: RefKind) {
    // A branch that was just made is chosen right after: it keeps its "created from" line.
    setRef((current) => (current.name === name ? current : { name, kind }));
    setRecent((list) => [name, ...list.filter((entry) => entry !== name)].slice(0, 5));
  }

  async function create(name: string, from: string) {
    await wait(900);
    if (name.startsWith("release/")) throw new Error("Release branches are protected. Ask a maintainer to create it.");
    setBranches((list) => [name, ...list]);
    setRef({ name, kind: "branch", fresh: from });
    setRecent((list) => [name, ...list].slice(0, 5));
  }

  return (
    <div className="w-full">
      <div className="mx-auto grid max-w-4xl gap-12">
        <Case caption="Open it and type. Try fcr for the initials of feature/checkout-redesign, v2.3 for a tag, or a new name such as feature/saved-views: the first row offers to create it from main, with a pause while it runs, and a name starting with release/ is refused.">
          <div className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-border px-4 py-3 sm:px-5">
              <p className="flex min-w-0 items-baseline gap-1.5 text-sm">
                <span className="text-muted-foreground">northwind /</span>
                <span className="font-semibold tracking-[-0.01em]">halcyon-api</span>
              </p>
              <Badge variant="outline">Public</Badge>
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-3 px-4 py-4 sm:px-5">
              <BranchSwitcher
                branches={branches}
                tags={TAGS}
                recent={recent}
                value={ref.name}
                onValueChange={choose}
                defaultRef="main"
                onCreate={create}
              />
              <p className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>
                  <span className="font-medium text-foreground tabular-nums">{branches.length}</span> branches
                </span>
                <span>
                  <span className="font-medium text-foreground tabular-nums">{TAGS.length}</span> tags
                </span>
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-border bg-muted/40 px-4 py-3 text-sm sm:px-5">
              <p className="flex min-w-0 items-center gap-2">
                <IconGitCommit aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
                <span className="truncate font-medium">{info.message}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                {info.author} · <span className="font-mono">{info.hash}</span> · {info.when}
              </p>
            </div>
          </div>
        </Case>

        <div className="grid gap-x-8 gap-y-10 md:grid-cols-2 md:items-start">
          <Case caption="The panel on its own, for a sheet on a phone. A hundred refs are cut to the first 40: Show 40 more, or Arrow Down at the end, draws the next batch.">
            <Surface>
              <BranchPanel branches={BRANCHES} tags={TAGS} recent={["feature/checkout-redesign", "release/2.4", "v2.3.2"]} value="feature/checkout-redesign" defaultRef="main" onChoose={() => undefined} autoFocus={false} />
            </Surface>
          </Case>
          <Case caption="Typing webhook: the letters that matched are bold, and a long name keeps the part that matched in view while its head gives way. The tabs count the matches, so a hit in the other tab is never missed.">
            <Surface>
              <BranchPanel branches={BRANCHES} tags={TAGS} recent={["feature/checkout-redesign"]} value="main" defaultRef="main" defaultQuery="webhook" onChoose={() => undefined} autoFocus={false} />
            </Surface>
          </Case>
          <Case caption="A name that is no branch yet: the first row makes it from main. A name Git would refuse says why instead.">
            <div className="grid gap-4">
              <Surface>
                <BranchPanel branches={BRANCHES} tags={TAGS} value="main" defaultRef="main" defaultQuery="feature/saved-views" onCreate={() => undefined} onChoose={() => undefined} autoFocus={false} />
              </Surface>
              <Surface>
                <BranchPanel branches={BRANCHES} tags={TAGS} value="main" defaultRef="main" defaultQuery="-draft..wip" onCreate={() => undefined} onChoose={() => undefined} autoFocus={false} />
              </Surface>
            </div>
          </Case>
          <Case caption="While the refs are on their way, and with nothing to show yet.">
            <div className="grid gap-4">
              <Surface>
                <BranchPanel branches={[]} loading onChoose={() => undefined} autoFocus={false} />
              </Surface>
              <Surface>
                <BranchPanel branches={["main", "develop", "release/2.4"]} tags={["v2.4.0", "v2.3.2", "v2.0.0"]} value="main" defaultRef="main" defaultQuery="v2" onChoose={() => undefined} autoFocus={false} />
              </Surface>
            </div>
          </Case>
        </div>
      </div>
    </div>
  );
}

function Case({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 content-start gap-3">
      <p className="text-xs leading-relaxed text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

/** The popover a panel sits in, drawn flat so the panel is seen in its place. */
function Surface({ children, className }: { children: ReactNode; className?: string }): React.JSX.Element {
  return <div className={cn("w-full max-w-[23rem] overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-md", className)}>{children}</div>;
}

const AUTHORS = ["Mara Veld", "Tomas Reyes", "Ines Okafor", "Jonas Berg"];
const WHEN = ["3 hours ago", "yesterday", "2 days ago", "last week", "12 days ago"];

function hash(text: string): number {
  let value = 7;
  for (const letter of text) value = (value * 31 + letter.charCodeAt(0)) >>> 0;
  return value;
}

/** A believable latest commit for a ref, worked out from its name so every ref has its own. */
function describe(name: string, kind: RefKind, fresh?: string): { message: string; author: string; hash: string; when: string } {
  const seed = hash(name);
  const author = AUTHORS[seed % AUTHORS.length] ?? "Mara Veld";
  const id = seed.toString(16).padStart(8, "0").slice(0, 7);
  if (fresh) return { message: `Branch created from ${fresh}`, author: "You", hash: id, when: "just now" };
  if (kind === "tag") return { message: `Release ${name}`, author, hash: id, when: WHEN[(seed >> 3) % WHEN.length] ?? "last week" };
  if (name === "main") return { message: "Merge pull request #418 from northwind/checkout-redesign", author, hash: id, when: "3 hours ago" };
  const last = (name.split("/").pop() ?? name).replace(/^[A-Z]+-\d+-/, "").replace(/-/g, " ");
  return { message: last.charAt(0).toUpperCase() + last.slice(1), author, hash: id, when: WHEN[(seed >> 3) % WHEN.length] ?? "last week" };
}

const AREAS = ["PAY", "SRCH", "AUTH", "INV", "RPT"];
const WORK = [
  "retry-failed-requests",
  "cache-invalidation",
  "keyboard-navigation",
  "empty-states",
  "rate-limits",
  "csv-import",
  "audit-trail",
  "pagination",
  "dark-mode",
  "timezone-handling",
  "bulk-actions",
  "error-messages",
];

const BRANCHES: readonly string[] = [
  "main",
  "develop",
  "feature/checkout-redesign",
  "fix/webhook-signature-check",
  "release/2.4",
  "release/2.3",
  "hotfix/2.4.1-session-expiry",
  "feature/PAY-1428-retry-failed-webhook-deliveries",
  ...Array.from({ length: 96 }, (_, at) => `${["feature", "fix", "chore", "refactor"][at % 4]}/${AREAS[at % 5]}-${1000 + at * 7}-${WORK[at % WORK.length]}`),
];

const TAGS: readonly string[] = ["v2.4.0", "v2.3.2", "v2.3.1", "v2.3.0", "v2.2.0", "v2.1.0", "v2.0.0", "v1.9.4"];
