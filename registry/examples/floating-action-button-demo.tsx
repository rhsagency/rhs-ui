"use client";

import { useRef, useState, type ReactNode, type RefObject } from "react";

import { IconCamera, IconEdit, IconFolder, IconHome, IconPlus, IconSettings, IconUser } from "@rhs-ui/icons";
import { Avatar, AvatarFallback, initialsOf } from "@rhs-ui/primitives/avatar";
import { BottomNav } from "@rhs-ui/primitives/bottom-nav";
import { FloatingActionButton } from "@rhs-ui/primitives/floating-action-button";
import { Switch } from "@rhs-ui/primitives/switch";
import { cn } from "@/lib/utils";

const INBOX = [
  { from: "Mara Jansen", subject: "Halcyon invoice 2041 is ready", time: "09:41" },
  { from: "Kestrel Design", subject: "Brand board v3: final comments", time: "09:12" },
  { from: "Northwind Support", subject: "Your ticket 3812 was resolved", time: "Yesterday" },
  { from: "Tomás Herrera", subject: "Re: Kickoff agenda for Monday", time: "Yesterday" },
  { from: "Lena Fischer", subject: "Photos from the offsite", time: "Mon" },
  { from: "Joris Bakker", subject: "Quarterly numbers, draft two", time: "Mon" },
  { from: "Sofia Marin", subject: "Can you review the SOW today?", time: "Sun" },
  { from: "Yara Haddad", subject: "Accessibility statement attached", time: "Sun" },
  { from: "Oskar Lindqvist", subject: "Webhook retries, a follow-up", time: "Fri" },
  { from: "Priya Nair", subject: "Refund confirmation for June", time: "Fri" },
  { from: "Camille Laurent", subject: "Studio visit on Thursday?", time: "Thu" },
  { from: "Daniel Okafor", subject: "API limits, as promised", time: "Thu" },
];

const PROJECTS = ["Brand refresh", "Q4 roadmap", "Harbour site", "Onboarding emails", "Pricing page", "Kestrel app", "Annual report", "Photo archive"];

const EXPENSES = [
  { group: "Today", title: "Train to Utrecht", note: "Travel", amount: "€18.40" },
  { group: "Today", title: "Lunch with the Halcyon team", note: "Meals", amount: "€48.20" },
  { group: "Yesterday", title: "Coworking day pass", note: "Workspace", amount: "€22.00" },
  { group: "Yesterday", title: "Design tool seats, October", note: "Software", amount: "€72.00" },
  { group: "Yesterday", title: "Taxi from Schiphol", note: "Travel", amount: "€39.50" },
  { group: "Monday", title: "Printing: 40 flyers", note: "Marketing", amount: "€31.90" },
  { group: "Monday", title: "Domain renewal", note: "Software", amount: "€14.99" },
  { group: "Monday", title: "Client dinner at Kestrel", note: "Meals", amount: "€126.40" },
  { group: "Sunday", title: "Parking, Rotterdam", note: "Travel", amount: "€11.00" },
  { group: "Sunday", title: "Notebook and pens", note: "Office", amount: "€16.75" },
];

/** A phone-sized screen. `relative` and `overflow-hidden` keep the button inside it: it is given `className="absolute"` to pin to the screen instead of the page. */
function Phone({ title, caption, children, footer }: { title: string; caption: string; children: ReactNode; footer?: ReactNode }): React.JSX.Element {
  return (
    <figure className="grid min-w-0 justify-items-center gap-4">
      <div className="relative h-[28rem] w-full max-w-[17.5rem] overflow-hidden rounded-[2rem] border border-border bg-background shadow-xs">
        <div className="flex h-12 items-end justify-between px-5 pb-2">
          <p className="text-[0.9375rem] font-semibold tracking-[-0.02em]">{title}</p>
        </div>
        {children}
      </div>
      <figcaption className="grid max-w-[17.5rem] justify-items-center gap-3 text-center">
        <span className="text-xs text-muted-foreground">{caption}</span>
        {footer}
      </figcaption>
    </figure>
  );
}

/** The scrolling part of a screen. It takes focus, so a keyboard can scroll it, and says what it holds. */
function Scroller({ scroller, label, children, className }: { scroller: RefObject<HTMLDivElement | null>; label: string; children: ReactNode; className?: string }): React.JSX.Element {
  return (
    <div
      ref={scroller}
      role="region"
      tabIndex={0}
      aria-label={label}
      className={cn("relative h-[calc(100%-3rem)] overflow-y-auto overscroll-contain outline-none [scrollbar-width:none] focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/40", className)}
    >
      {children}
    </div>
  );
}

function InboxPhone(): React.JSX.Element {
  const scroller = useRef<HTMLDivElement>(null);
  const [pressed, setPressed] = useState(0);
  return (
    <Phone title="Inbox" caption={pressed ? `Composer opened ${pressed} time${pressed === 1 ? "" : "s"}. Scroll the list to fold the label away.` : "Scroll the list: the label folds into the icon, and returns when you scroll up."}>
      <Scroller scroller={scroller} label="Messages">
        <ul className="pb-24">
          {INBOX.map((mail) => (
            <li key={`${mail.from}-${mail.subject}`} className="flex items-center gap-3 border-b border-border/70 px-5 py-3">
              <Avatar>
                <AvatarFallback>{initialsOf(mail.from)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[0.8125rem] font-medium">{mail.from}</p>
                <p className="truncate text-xs text-muted-foreground">{mail.subject}</p>
              </div>
              <span className="shrink-0 text-[0.6875rem] text-muted-foreground">{mail.time}</span>
            </li>
          ))}
        </ul>
      </Scroller>
      <FloatingActionButton className="absolute" icon={<IconEdit />} label="New message" scrollTarget={scroller} onClick={() => setPressed((count) => count + 1)} />
    </Phone>
  );
}

function ProjectsPhone(): React.JSX.Element {
  const [pressed, setPressed] = useState(false);
  return (
    <Phone title="Projects" caption={pressed ? "Project created. The button sits above the tab bar." : "Icon only, lifted by offset so it clears the tab bar. Hover it for the label."}>
      {/* The tab bar sits under the list instead of over it, so nothing scrolls beneath it. */}
      <div className="flex h-[calc(100%-3rem)] flex-col">
        <div
          role="region"
          tabIndex={0}
          aria-label="Projects"
          className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-20 outline-none [scrollbar-width:none] focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/40"
        >
          <ul className="grid grid-cols-2 gap-3">
            {PROJECTS.map((name, index) => (
              <li key={name} className="space-y-2">
                <div className="aspect-[4/3] rounded-xl bg-muted" style={{ opacity: 1 - (index % 3) * 0.12 }} />
                <p className="truncate text-[0.8125rem] font-medium">{name}</p>
                <p className="-mt-1.5 text-[0.6875rem] text-muted-foreground">Edited {index + 1}h ago</p>
              </li>
            ))}
          </ul>
        </div>
        <BottomNav
          className="static md:block"
          current="#projects"
          items={[
            { href: "#home", label: "Home", icon: <IconHome className="size-5" /> },
            { href: "#projects", label: "Projects", icon: <IconFolder className="size-5" /> },
            { href: "#team", label: "Team", icon: <IconUser className="size-5" /> },
            { href: "#settings", label: "Settings", icon: <IconSettings className="size-5" /> },
          ]}
        />
      </div>
      <FloatingActionButton className="absolute" icon={<IconPlus />} label="New project" extended={false} offset={56} onClick={() => setPressed(true)} />
    </Phone>
  );
}

function ExpensesPhone(): React.JSX.Element {
  const scroller = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  let previous = "";
  return (
    <Phone
      title="October"
      caption="Centred, always labelled. Turn the switch on, as a dialog would, and the button leaves."
      footer={
        <label className="flex items-center gap-2.5 text-xs text-foreground">
          <Switch checked={!visible} onCheckedChange={(checked) => setVisible(!checked)} />
          Dialog open
        </label>
      }
    >
      <Scroller scroller={scroller} label="Expenses">
        <div className="px-5 pb-24">
          {EXPENSES.map((expense) => {
            const heading = expense.group !== previous;
            previous = expense.group;
            return (
              <div key={`${expense.group}-${expense.title}`}>
                {heading ? <p className="pt-3 pb-1 text-[0.6875rem] font-medium text-muted-foreground">{expense.group}</p> : null}
                <div className="flex items-center justify-between gap-3 border-b border-border/70 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-[0.8125rem] font-medium">{expense.title}</p>
                    <p className="text-[0.6875rem] text-muted-foreground">{expense.note}</p>
                  </div>
                  <span className="shrink-0 text-[0.8125rem] tabular-nums">{expense.amount}</span>
                </div>
              </div>
            );
          })}
        </div>
      </Scroller>
      <FloatingActionButton className="absolute" icon={<IconCamera />} label="Scan receipt" position="bottom-center" extended visible={visible} />
    </Phone>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-14">
      <div className="grid gap-x-8 gap-y-12 [grid-template-columns:repeat(auto-fit,minmax(min(100%,17.5rem),1fr))]">
        <InboxPhone />
        <ProjectsPhone />
        <ExpensesPhone />
      </div>
    </div>
  );
}
