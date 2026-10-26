"use client";

import { useRef, useState, type ReactNode } from "react";

import { LikeButton } from "@rhs-ui/application/like-button";
import { IconStar, IconThumbsUp } from "@rhs-ui/icons";
import { Avatar, AvatarFallback, initialsOf } from "@rhs-ui/primitives/avatar";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * The parent keeps the truth, as in a real app: liked and the count change together once the server has said yes.
 * `failFirst` makes the first request fail, so the rollback can be seen.
 */
function useLike(initial: { liked: boolean; count: number }, failFirst = false) {
  const [state, setState] = useState(initial);
  const spent = useRef(!failFirst);
  const onToggle = async (next: boolean) => {
    await wait(550);
    if (!spent.current) {
      spent.current = true;
      throw new Error("offline");
    }
    setState((current) => ({ liked: next, count: current.count + (next ? 1 : -1) }));
  };
  return { ...state, onToggle };
}

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start justify-items-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

function Person({ name, note }: { name: string; note: string }): React.JSX.Element {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar size="sm">
        <AvatarFallback>{initialsOf(name)}</AvatarFallback>
      </Avatar>
      <p className="min-w-0 text-sm leading-snug">
        <span className="font-medium">{name}</span>
        <span className="text-muted-foreground"> &middot; {note}</span>
      </p>
    </div>
  );
}

function Article(): React.JSX.Element {
  const like = useLike({ liked: false, count: 1204 });
  return (
    <article className="w-full rounded-xl border border-border bg-card p-5 shadow-xs sm:p-6">
      <Person name="Maya Okafor" note="Northwind design systems, 6 min read" />
      <h2 className="mt-4 text-xl leading-snug font-semibold tracking-[-0.02em] text-balance">What we learned shipping a design system in six weeks</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        We started with forty components and ended with eleven. The rest turned out to be variations nobody had asked for, and cutting them first bought us a month.
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-border pt-4">
        <LikeButton label="Like this post" names={["Theo Brandt", "Ines Kowalski"]} liked={like.liked} count={like.count} onToggle={like.onToggle} />
        <p className="text-xs text-muted-foreground">86 comments</p>
      </div>
    </article>
  );
}

function Comment({ name, when, text, like }: { name: string; when: string; text: string; like: ReturnType<typeof useLike> }): React.JSX.Element {
  return (
    <li className="flex gap-3 px-4 py-4 sm:px-5">
      <Avatar size="sm">
        <AvatarFallback>{initialsOf(name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="text-sm">
          <span className="font-medium">{name}</span>
          <span className="text-muted-foreground"> &middot; {when}</span>
        </p>
        <p className="mt-1 text-sm leading-relaxed text-pretty">{text}</p>
        <div className="mt-2 -ml-2">
          <LikeButton compact label={`Like ${name}'s comment`} liked={like.liked} count={like.count} onToggle={like.onToggle} />
        </div>
      </div>
    </li>
  );
}

function Comments(): React.JSX.Element {
  const first = useLike({ liked: true, count: 48 });
  const second = useLike({ liked: false, count: 7 });
  const third = useLike({ liked: false, count: 0 }, true);
  return (
    <ul className="w-full divide-y divide-border rounded-xl border border-border bg-card shadow-xs">
      <Comment name="Ines Kowalski" when="2 days ago" text="Cutting the variants first was the right call. We kept a spreadsheet of every one-off and deleted two thirds of it." like={first} />
      <Comment name="Tomas Brandt" when="yesterday" text="Would love a follow-up on how you handled theming across the three brands." like={second} />
      <Comment name="Mara Okafor" when="3 hours ago" text="The six-week deadline did a lot of the design work for you." like={third} />
    </ul>
  );
}

function Pair({ icon, label, showCount = true, count, locale, noun, disabled }: { icon?: ReactNode; label: string; showCount?: boolean; count: number; locale?: string; noun?: readonly [string, string]; disabled?: boolean }): React.JSX.Element {
  const like = useLike({ liked: false, count });
  return <LikeButton icon={icon} label={label} showCount={showCount} locale={locale} noun={noun} disabled={disabled} liked={like.liked} count={like.count} onToggle={like.onToggle} />;
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-2xl gap-9">
      <Example caption="A post. The count reads 1.2K; the button is named with the exact number, and the tooltip says who liked it.">
        <Article />
      </Example>

      <Example caption="Comments, with the compact button. Mara's comment fails the first time you like it, to show the rollback.">
        <Comments />
      </Example>

      <div className="grid gap-x-10 gap-y-8 [grid-template-columns:repeat(auto-fit,minmax(min(100%,13rem),1fr))]">
        <Example caption="Any glyph, filled once liked">
          <div className="flex flex-wrap items-center gap-3">
            <Pair icon={<IconThumbsUp />} label="Mark as helpful" count={23} />
            <Pair icon={<IconStar />} label="Star this recipe" count={308} />
          </div>
        </Example>
        <Example caption="Uncontrolled: 999 becomes 1K">
          <LikeButton label="Like this photo" count={999} onToggle={() => wait(500)} />
        </Example>
        <Example caption="Numbers by locale: 1,2 Mio.">
          <Pair label="Gefällt mir" noun={["Like", "Likes"]} count={1_240_000} locale="de-DE" />
        </Example>
        <Example caption="No count, and disabled">
          <div className="flex flex-wrap items-center gap-3">
            <Pair label="Like this post" count={12} showCount={false} />
            <Pair label="Like this post" count={12} disabled />
          </div>
        </Example>
      </div>
    </div>
  );
}
