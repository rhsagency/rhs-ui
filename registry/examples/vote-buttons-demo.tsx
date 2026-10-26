"use client";

import { useRef, useState, type ReactNode } from "react";

import { VoteButtons, type Vote } from "@rhs-ui/application/vote-buttons";
import { Avatar, AvatarFallback, initialsOf } from "@rhs-ui/primitives/avatar";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const WEIGHT: Record<Vote, number> = { none: 0, up: 1, down: -1 };

/**
 * The parent keeps the truth, as in a real app: the vote and the score change together once the server has said yes.
 * `failFirst` makes the first request fail, so the restore can be seen.
 */
function useVote(initial: { value: Vote; score: number }, failFirst = false) {
  const [state, setState] = useState(initial);
  const spent = useRef(!failFirst);
  const onVote = async (next: Vote) => {
    await wait(550);
    if (!spent.current) {
      spent.current = true;
      throw new Error("offline");
    }
    setState((current) => ({ value: next, score: current.score + WEIGHT[next] - WEIGHT[current.value] }));
  };
  return { ...state, onVote };
}

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start justify-items-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

function Post({ vote, subject, name, when, children }: { vote: ReturnType<typeof useVote>; subject: string; name: string; when: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-4 px-4 py-5 sm:gap-5 sm:px-5">
      <VoteButtons subject={subject} value={vote.value} score={vote.score} onVote={vote.onVote} />
      <div className="min-w-0">
        {children}
        <div className="mt-3 flex items-center gap-2.5">
          <Avatar size="sm">
            <AvatarFallback>{initialsOf(name)}</AvatarFallback>
          </Avatar>
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{name}</span> &middot; {when}
          </p>
        </div>
      </div>
    </div>
  );
}

function Thread(): React.JSX.Element {
  const question = useVote({ value: "none", score: 124 });
  const best = useVote({ value: "up", score: 41 }, true);
  const other = useVote({ value: "none", score: 3 });
  return (
    <div className="w-full divide-y divide-border rounded-xl border border-border bg-card shadow-xs">
      <Post vote={question} subject="question" name="Tomas Brandt" when="asked 2 days ago">
        <h2 className="text-base leading-snug font-semibold tracking-[-0.02em] text-balance">How do I rotate an API key without downtime?</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">Our batch jobs hold a key for hours, and revoking it mid-run fails the whole night.</p>
      </Post>
      <Post vote={best} subject="answer" name="Ines Kowalski" when="answered 1 day ago">
        <p className="text-sm leading-relaxed">Create the new key first and deploy it next to the old one. Both are valid for 24 hours, so you can revoke the old key once traffic has drained.</p>
      </Post>
      <Post vote={other} subject="answer" name="Mara Okafor" when="answered 6 hours ago">
        <p className="text-sm leading-relaxed">
          The CLI does the same in one step: <span className="rounded-sm bg-muted px-1.5 py-0.5 font-mono text-[0.8125rem]">northwind keys rotate --overlap 24h</span>
        </p>
      </Post>
    </div>
  );
}

const REQUESTS = [
  { id: "dark", title: "Dark mode for the dashboard", detail: "Planned for the next release", vote: { value: "up" as Vote, score: 892 } },
  { id: "csv", title: "Export invoices as CSV", detail: "Under review", vote: { value: "none" as Vote, score: 341 } },
  { id: "sso", title: "Single sign-on on the free plan", detail: "Open", vote: { value: "none" as Vote, score: 87 } },
];

function FeatureRequest({ title, detail, vote }: { title: string; detail: string; vote: { value: Vote; score: number } }): React.JSX.Element {
  const state = useVote(vote);
  return (
    <li className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 px-4 py-3.5 sm:px-5">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{detail}</p>
      </div>
      <VoteButtons orientation="horizontal" allowDownvote={false} subject="request" value={state.value} score={state.score} onVote={state.onVote} />
    </li>
  );
}

// Uncontrolled: the score was written for no vote, and moves by itself.
function Pair({ size }: { size: "sm" | "default" | "lg" }): React.JSX.Element {
  return <VoteButtons orientation="horizontal" size={size} subject="comment" score={18} onVote={() => wait(500)} />;
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-2xl gap-9">
      <Example caption="A question and its answers. Changing your vote on the first one fails once: the score is put back, with a message beside the control.">
        <Thread />
      </Example>

      <Example caption="Feature requests: with the down arrow off it is a single arrow with a count">
        <ul className="w-full divide-y divide-border rounded-xl border border-border bg-card shadow-xs">
          {REQUESTS.map((request) => (
            <FeatureRequest key={request.id} title={request.title} detail={request.detail} vote={request.vote} />
          ))}
        </ul>
      </Example>

      <div className="grid gap-x-10 gap-y-8 [grid-template-columns:repeat(auto-fit,minmax(min(100%,15rem),1fr))]">
        <Example caption="Uncontrolled, three sizes">
          <div className="flex flex-wrap items-center gap-3">
            <Pair size="sm" />
            <Pair size="default" />
            <Pair size="lg" />
          </div>
        </Example>
        <Example caption="Disabled, for a post you wrote">
          <VoteButtons orientation="horizontal" subject="post" score={57} disabled />
        </Example>
      </div>
    </div>
  );
}
