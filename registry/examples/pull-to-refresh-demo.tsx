"use client";

import { useRef, useState, type ReactNode } from "react";

import { IconCheck } from "@rhs-ui/icons";
import { Avatar, AvatarFallback, initialsOf } from "@rhs-ui/primitives/avatar";
import { Label } from "@rhs-ui/primitives/label";
import { PullToRefresh, PullToRefreshIndicator } from "@rhs-ui/primitives/pull-to-refresh";
import { Switch } from "@rhs-ui/primitives/switch";
import { cn } from "@/lib/utils";

interface Mail {
  id: number;
  from: string;
  subject: string;
  preview: string;
  time: string;
  unread?: boolean;
}

const INBOX: readonly Omit<Mail, "id">[] = [
  { from: "Mara Visser", subject: "Q3 planning draft", preview: "I left comments on the roadmap, mostly about the dates in October.", time: "09:42", unread: true },
  { from: "Halcyon Billing", subject: "Invoice INV-2041 is ready", preview: "€1,240.00 is due on 14 November. You can pay by card or transfer.", time: "09:15", unread: true },
  { from: "Jonas Albrecht", subject: "Re: Kestrel onboarding", preview: "Agreed on four steps. Can you send the copy for the third one?", time: "08:58" },
  { from: "Priya Raman", subject: "Design review moved", preview: "It is now at 15:00 in the studio. Bring one screen you are unsure about.", time: "08:30" },
  { from: "Northwind Support", subject: "Ticket 5520 is resolved", preview: "The replacement lamp ships tomorrow with tracking.", time: "Yesterday" },
  { from: "Leo Marchetti", subject: "Pricing experiments", preview: "Day five results are in the shared folder. The annual toggle won.", time: "Yesterday" },
  { from: "Amara Okafor", subject: "Thanks for the intro", preview: "It was lovely to meet Tomás. We are speaking again on Thursday.", time: "Yesterday" },
  { from: "Tidewater Books", subject: "Your order has shipped", preview: "Track parcel NL-48211. Delivery is expected on Wednesday.", time: "Mon" },
  { from: "Hana Sato", subject: "Weekend deploy notes", preview: "Nothing broke. I checked twice, then once more.", time: "Mon" },
  { from: "Daniel Cho", subject: "Hiring: staff designer", preview: "Three strong candidates. Can we meet to compare notes?", time: "Sun" },
];

const FRESH: readonly Omit<Mail, "id">[] = [
  { from: "Atlas Courier", subject: "Delivery window confirmed", preview: "Tomorrow between 10:00 and 12:00. Someone needs to be in.", time: "Just now", unread: true },
  { from: "Tomás Silva", subject: "Release freeze", preview: "A reminder that the freeze starts on Thursday at noon.", time: "Just now", unread: true },
  { from: "Fernhill Garden", subject: "Your seeds are on their way", preview: "Order 3318 left the warehouse this morning.", time: "Just now", unread: true },
  { from: "Mara Visser", subject: "Re: Q3 planning draft", preview: "Thank you, I have moved the beta to the 14th.", time: "Just now", unread: true },
];

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-1 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

function Row({ mail }: { mail: Mail }): React.JSX.Element {
  return (
    <li className="flex gap-3 border-b border-border px-4 py-3 last:border-b-0">
      <Avatar>
        <AvatarFallback>{initialsOf(mail.from)}</AvatarFallback>
      </Avatar>
      <div className="grid min-w-0 flex-1 grid-cols-1 gap-0.5">
        <p className="flex items-baseline justify-between gap-3 text-sm">
          <span className={cn("truncate", mail.unread ? "font-semibold" : "font-medium")}>
            {mail.from}
            {mail.unread ? <span className="sr-only"> (unread)</span> : null}
          </span>
          <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{mail.time}</span>
        </p>
        <p className={cn("truncate text-sm", mail.unread ? "text-foreground" : "text-muted-foreground")}>{mail.subject}</p>
        <p className="truncate text-xs text-muted-foreground">{mail.preview}</p>
      </div>
      {/* The slot is there on every row, so the times line up whether or not a dot is in it. */}
      <span aria-hidden="true" className="mt-2 size-2 shrink-0">
        {mail.unread ? <span className="block size-2 rounded-full bg-foreground" /> : null}
      </span>
    </li>
  );
}

function Inbox(): React.JSX.Element {
  const [mails, setMails] = useState<readonly Mail[]>(() => INBOX.map((mail, index) => ({ ...mail, id: index })));
  const [failNext, setFailNext] = useState(false);
  const round = useRef(0);
  const ids = useRef(INBOX.length);

  /** Pretends to ask the server: a moment later two new messages are at the top, or, when asked to, the server does not answer. */
  function refresh() {
    const fails = failNext;
    return new Promise<void>((resolve, reject) => {
      window.setTimeout(() => {
        if (fails) {
          setFailNext(false);
          reject(new Error("The mail server did not answer."));
          return;
        }
        const start = (round.current++ * 2) % FRESH.length;
        const arrived = [0, 1].map((offset) => ({ ...(FRESH[(start + offset) % FRESH.length] as Omit<Mail, "id">), id: ids.current++ }));
        setMails((current) => [...arrived, ...current.map((mail) => ({ ...mail, time: mail.time === "Just now" ? "1 min ago" : mail.time }))]);
        resolve();
      }, 1100);
    });
  }

  return (
    <div className="grid gap-4">
      <PullToRefresh header="Inbox" listLabel="Inbox" onRefresh={refresh} className="h-[28rem]">
        <ul>
          {mails.map((mail) => (
            <Row key={mail.id} mail={mail} />
          ))}
        </ul>
      </PullToRefresh>
      <div className="flex items-center gap-2.5">
        <Switch id="refresh-fail" checked={failNext} onCheckedChange={setFailNext} />
        <Label htmlFor="refresh-fail" className="font-normal text-muted-foreground">
          Make the next refresh fail
        </Label>
      </div>
    </div>
  );
}

const FACTS = ["Only touch and pen start a pull: the wheel and the trackpad scroll as usual", "Let go before the threshold and nothing happens", "The Refresh button in the bar runs the same handler", "The result is announced, and a failure says so"] as const;

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-3xl grid-cols-1 gap-x-10 gap-y-10 md:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] md:items-start">
      <Example caption="Drag the list down on a touch screen, or press Refresh. The switch makes the next refresh fail">
        <Inbox />
      </Example>
      <Example caption="What the indicator says on the way down">
        <div className="grid gap-5">
          <div className="grid gap-4 rounded-xl border border-border bg-muted/50 p-5">
            <PullToRefreshIndicator progress={0.35} phase="pull" />
            <PullToRefreshIndicator progress={1} phase="release" />
            <PullToRefreshIndicator progress={1} phase="refreshing" />
          </div>
          <ul className="grid gap-2.5 text-sm text-muted-foreground">
            {FACTS.map((fact) => (
              <li key={fact} className="flex items-start gap-2.5">
                <IconCheck size={14} strokeWidth={2.5} aria-hidden="true" className="mt-1 shrink-0 text-foreground" />
                {fact}
              </li>
            ))}
          </ul>
        </div>
      </Example>
    </div>
  );
}
