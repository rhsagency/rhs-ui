"use client";

import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";

import { IconBell, IconCalendar, IconCamera, IconCreditCard, IconFileText, IconFolder, IconHeadphones, IconChartBar, IconTag, IconUsers } from "@rhs-ui/icons";
import { StickyCtaBar } from "@rhs-ui/marketing/sticky-cta-bar";
import { Button } from "@rhs-ui/primitives/button";
import { Input } from "@rhs-ui/primitives/input";
import { Label } from "@rhs-ui/primitives/label";

/**
 * A browser window with a page that scrolls inside it, so the bar can be seen coming and going without a long page.
 * On a real page you pass no scrollRoot: the bar is then fixed to the bottom of the screen and watches the window.
 */
function Window({ url, scroller, start, children, bar }: { url: string; scroller: RefObject<HTMLDivElement | null>; start: number | string; children: ReactNode; bar: ReactNode }): React.JSX.Element {
  // Start scrolled to where the bar belongs (a distance, or just past an element), so the first thing on show is the bar in place.
  useEffect(() => {
    const node = typeof start === "string" ? document.getElementById(start) : null;
    scroller.current?.scrollTo({ top: typeof start === "number" ? start : node ? node.offsetTop + node.offsetHeight + 24 : 0 });
  }, [scroller, start]);
  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-card shadow-xs">
      <div className="flex h-10 items-center gap-3 border-b border-border bg-muted/50 px-3.5">
        <span aria-hidden="true" className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-border" />
          <span className="size-2.5 rounded-full bg-border" />
          <span className="size-2.5 rounded-full bg-border" />
        </span>
        <span className="mx-auto w-full max-w-60 truncate rounded-md border border-border bg-background px-3 py-0.5 text-center text-xs text-muted-foreground">{url}</span>
        <span aria-hidden="true" className="w-9 shrink-0" />
      </div>
      <div ref={scroller} tabIndex={0} role="region" aria-label={`Preview of ${url}`} className="relative h-[27rem] overflow-y-auto bg-background outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:ring-inset">
        {children}
      </div>
      {bar}
    </div>
  );
}

function Caption({ children }: { children: ReactNode }): React.JSX.Element {
  return <p className="mb-3 min-h-8 text-xs text-muted-foreground">{children}</p>;
}

function Row({ title, text, icon }: { title: string; text: string; icon: ReactNode }): React.JSX.Element {
  return (
    <div className="flex gap-4 border-t border-border py-6">
      <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-lg border border-border bg-muted/50 [&_svg]:size-[1.125rem]">
        {icon}
      </span>
      <div className="min-w-0">
        <h3 className="text-base font-semibold tracking-[-0.02em]">{title}</h3>
        <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}

function PageChrome({ name, children }: { name: string; children: ReactNode }): React.JSX.Element {
  return (
    <div>
      <div className="flex items-center justify-between px-6 py-4">
        <span className="font-semibold tracking-[-0.03em]">{name}</span>
        <span aria-hidden="true" className="flex gap-4 text-xs text-muted-foreground">
          <span>Product</span>
          <span>Pricing</span>
          <span>Sign in</span>
        </span>
      </div>
      {children}
    </div>
  );
}

function HalcyonPage(): React.JSX.Element {
  return (
    <PageChrome name="Halcyon">
      <section id="halcyon-hero" className="px-6 pt-12 pb-16 text-center">
        <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">Scheduling for studios</p>
        <h3 className="mx-auto mt-4 max-w-sm text-4xl leading-[1.05] font-medium tracking-[-0.04em] text-balance">Booking that runs itself</h3>
        <p className="mx-auto mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">Classes, rooms and reminders in one calm calendar.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button size="sm">Start free trial</Button>
          <Button size="sm" variant="outline">
            See how it works
          </Button>
        </div>
      </section>
      <div className="px-6">
        <Row icon={<IconBell />} title="Fewer no-shows" text="Reminders go out by text and email, and one tap moves a booking to another day." />
        <Row icon={<IconCalendar />} title="One calendar for every room" text="Rooms, teachers and equipment can no longer be booked twice." />
        <Row icon={<IconCreditCard />} title="Payments that settle themselves" text="Passes, drop-ins and memberships, paid out every Friday." />
        <Row icon={<IconUsers />} title="Teachers see their own week" text="Each teacher gets a calendar feed, with the room, the class size and who is on the waiting list." />
        <Row icon={<IconChartBar />} title="Reports that fit in a meeting" text="Attendance, revenue and retention on one page, exported in a click." />
      </div>
      <section id="halcyon-signup" className="mt-8 border-y border-border bg-muted/40 px-6 py-10">
        <h3 className="text-lg font-semibold tracking-[-0.02em]">Start your 14-day trial</h3>
        <p className="mt-1 text-sm text-muted-foreground">No card needed.</p>
        <div className="mt-4 grid max-w-xs gap-2">
          <Label htmlFor="halcyon-email">Work email</Label>
          <div className="flex gap-2">
            <Input id="halcyon-email" type="email" placeholder="you@studio.com" />
            <Button className="shrink-0">Start</Button>
          </div>
        </div>
      </section>
      <div className="px-6 py-8 text-xs text-muted-foreground">&copy; 2026 Halcyon Scheduling. Made in Rotterdam.</div>
    </PageChrome>
  );
}

function KestrelPage(): React.JSX.Element {
  return (
    <PageChrome name="Kestrel">
      <section className="px-6 pt-10 pb-12">
        <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">Kestrel Studio</p>
        <h3 className="mt-4 max-w-xs text-4xl leading-[1.05] font-medium tracking-[-0.04em] text-balance">Photography you can keep using</h3>
        <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">A shared library, simple licences and a retoucher who answers on Monday.</p>
      </section>
      <div className="px-6">
        <Row icon={<IconFileText />} title="Licences in plain words" text="Every image says where it can be used, for how long and by whom." />
        <Row icon={<IconFolder />} title="A library that stays tidy" text="Collections, approvals and a rights check before anything goes live." />
        <Row icon={<IconCamera />} title="Retouching on call" text="Send a batch before lunch and have it back the next morning." />
        <Row icon={<IconTag />} title="Prices that do not move" text="The monthly price is the price. Annual billing takes two months off." />
        <Row icon={<IconHeadphones />} title="Support from the studio" text="You talk to the people who shot and edited the pictures." />
      </div>
      <div className="mt-6 px-6 py-8 text-xs text-muted-foreground">&copy; 2026 Kestrel Studio. Amsterdam and Ghent.</div>
    </PageChrome>
  );
}

export default function Demo(): React.JSX.Element {
  const halcyon = useRef<HTMLDivElement>(null);
  const kestrel = useRef<HTMLDivElement>(null);
  const [closed, setClosed] = useState(false);
  const [epoch, setEpoch] = useState(0);
  return (
    <div className="mx-auto max-w-6xl px-6 py-10 sm:py-16">
      <div className="grid grid-cols-1 gap-x-8 gap-y-10 lg:grid-cols-2">
        <div className="min-w-0">
          <Caption>The bar appears once the hero has scrolled away and leaves while the sign-up form is on screen. Scroll the page up and down.</Caption>
          <Window
            url="halcyon.example/product"
            scroller={halcyon}
            start="halcyon-hero"
            bar={
              <StickyCtaBar
                scrollRoot={halcyon}
                label="Halcyon Pro, free for 14 days"
                description="No card needed. Cancel in two clicks."
                action={<Button size="sm">Start trial</Button>}
                showAfter="halcyon-hero"
                hideWhen="halcyon-signup"
                dismissible
              />
            }
          >
            <HalcyonPage />
          </Window>
        </div>
        <div className="min-w-0">
          <Caption>
            A price instead of a promise, after 240 pixels of scrolling. It can be closed.{" "}
            {closed ? (
              <button type="button" onClick={() => { setClosed(false); setEpoch((n) => n + 1); }} className="rounded-sm text-foreground underline decoration-foreground/40 underline-offset-4 outline-none hover:decoration-current focus-visible:ring-[3px] focus-visible:ring-ring/40">
                Bring it back
              </button>
            ) : null}
          </Caption>
          <Window
            url="kestrel.example"
            scroller={kestrel}
            start={300}
            bar={
              <StickyCtaBar
                key={epoch}
                scrollRoot={kestrel}
                label="Kestrel Studio, from €29 a month"
                description="Billed yearly. Two months are free."
                action={<Button size="sm">See plans</Button>}
                showAfter={240}
                dismissible
                onDismiss={() => setClosed(true)}
              />
            }
          >
            <KestrelPage />
          </Window>
        </div>
      </div>
    </div>
  );
}
