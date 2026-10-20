"use client";

import { useRef, useState, type ReactNode } from "react";

import { FollowButton, type FollowStatus } from "@rhs-ui/application/follow-button";
import { Avatar, AvatarFallback, initialsOf } from "@rhs-ui/primitives/avatar";

interface Account {
  id: string;
  name: string;
  about: string;
  status: FollowStatus;
  count: number;
  isPrivate?: boolean;
  topic?: boolean;
}

const INITIAL: Account[] = [
  { id: "maya", name: "Maya Okafor", about: "Head of Partnerships at Halcyon", status: "none", count: 1204 },
  { id: "design-systems", name: "Design systems", about: "Notes on building component libraries", status: "following", count: 18420, topic: true },
  { id: "kestrel", name: "Kestrel Studio", about: "Design and engineering, Amsterdam", status: "requested", count: 892, isPrivate: true },
  { id: "halcyon", name: "Halcyon Labs", about: "Research on calm software", status: "none", count: 3187 },
];

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start justify-items-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const [accounts, setAccounts] = useState(INITIAL);
  // Halcyon Labs fails the first time, so the rollback can be seen.
  const failedOnce = useRef(false);

  // The parent keeps the truth: the status and the count change together, before the promise resolves.
  const settle = (id: string, status: FollowStatus) =>
    setAccounts((current) =>
      current.map((account) => {
        if (account.id !== id) return account;
        const delta = (status === "following" ? 1 : 0) - (account.status === "following" ? 1 : 0);
        return { ...account, status, count: account.count + delta };
      }),
    );

  return (
    <div className="grid w-full max-w-2xl gap-9">
      <Example caption="Who to follow. Halcyon Labs fails the first time you press Follow, to show the rollback.">
        <ul className="w-full divide-y divide-border rounded-xl border border-border bg-card shadow-xs">
          {accounts.map((account) => (
            <li key={account.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 px-4 py-4 sm:px-5">
              <div className="flex min-w-0 items-center gap-3.5">
                <Avatar className={account.topic ? "rounded-lg" : undefined}>
                  <AvatarFallback className={account.topic ? "rounded-lg" : undefined}>{initialsOf(account.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{account.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{account.about}</p>
                </div>
              </div>
              <FollowButton
                name={account.name}
                // The error line is wider than the button: right-aligned, the control keeps its right edge instead of jumping left when a follow fails.
                className="sm:items-end"
                status={account.status}
                count={account.count}
                isPrivate={account.isPrivate}
                noun={account.topic ? ["reader", "readers"] : undefined}
                variant={account.topic ? "outline" : "default"}
                onFollow={async () => {
                  await wait(650);
                  if (account.id === "halcyon" && !failedOnce.current) {
                    failedOnce.current = true;
                    throw new Error("offline");
                  }
                  settle(account.id, account.isPrivate ? "requested" : "following");
                  return account.isPrivate ? "requested" : "following";
                }}
                onUnfollow={async () => {
                  await wait(500);
                  settle(account.id, "none");
                }}
              />
            </li>
          ))}
        </ul>
      </Example>

      <div className="grid gap-x-10 gap-y-8 [grid-template-columns:repeat(auto-fit,minmax(min(100%,17rem),1fr))]">
        <Example caption="A private account you follow: unfollowing asks once">
          <FollowButton name="Studio Polder" defaultStatus="following" isPrivate count={540} onUnfollow={() => wait(500)} />
        </Example>
        <Example caption="Sizes, with no count">
          <div className="flex flex-wrap items-center gap-3">
            <FollowButton name="Theo Okonkwo" size="sm" variant="secondary" />
            <FollowButton name="Theo Okonkwo" />
            <FollowButton name="Theo Okonkwo" size="lg" variant="outline" />
          </div>
        </Example>
      </div>
    </div>
  );
}
