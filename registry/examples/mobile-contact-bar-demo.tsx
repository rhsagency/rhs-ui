"use client";

import { useEffect, useRef, type ReactNode, type RefObject } from "react";

import { IconMenu, IconStar } from "@rhs-ui/icons";
import { MobileContactBar } from "@rhs-ui/marketing/mobile-contact-bar";
import { Button } from "@rhs-ui/primitives/button";

export default function Demo(): React.JSX.Element {
  const first = useRef<HTMLDivElement>(null);
  const second = useRef<HTMLDivElement>(null);

  return (
    <div className="mx-auto max-w-5xl py-8 sm:px-6 sm:py-12">
      <div className="grid grid-cols-1 gap-x-10 gap-y-14 lg:grid-cols-2">
        <div className="min-w-0">
          <Caption>Four equal actions from the first paint. The number and the street are written under the icons, so nobody has to guess what a handset means. Scroll the page: the bar stays, and adds its own room at the end.</Caption>
          <Phone
            label="Studio Lumen on a phone"
            scroller={first}
            bar={
              <MobileContactBar
                scrollRoot={first}
                hideFrom="never"
                actions={[
                  { kind: "call", label: "Call", detail: "033 555 0142", href: "tel:+31335550142" },
                  { kind: "whatsapp", label: "WhatsApp", detail: "Message us", href: "https://wa.me/31335550142", external: true },
                  { kind: "directions", label: "Directions", detail: "Hof 14", href: "https://maps.example.com/?q=Hof+14+Amersfoort", external: true },
                  { kind: "book", label: "Book", detail: "Online", href: "https://book.example.com/studio-lumen", external: true },
                ]}
              />
            }
          >
            <SalonPage prefix="first" />
          </Phone>
        </div>

        <div className="min-w-0">
          <Caption>Three actions with the number in the label, and showAfter set: the bar slides in once the first 240 pixels have scrolled away. Under reduced motion it fades in place.</Caption>
          <Phone
            label="Studio Lumen on a phone, scrolled"
            scroller={second}
            startAt="second-prices"
            bar={
              <MobileContactBar
                scrollRoot={second}
                hideFrom="never"
                showAfter={240}
                labels={{ nav: "Contact the salon" }}
                actions={[
                  { kind: "call", label: "Call 033\u00a0555\u00a00142", href: "tel:+31335550142" },
                  { kind: "directions", label: "Find us", href: "https://maps.example.com/?q=Hof+14+Amersfoort", external: true },
                  { kind: "book", label: "Book a chair", href: "https://book.example.com/studio-lumen", external: true },
                ]}
              />
            }
          >
            <SalonPage prefix="second" />
          </Phone>
        </div>
      </div>
    </div>
  );
}

/**
 * A phone with a page that scrolls inside it, so the bar can be seen in place at any width. On a real site you pass no scrollRoot:
 * the bar is fixed to the bottom of the screen and hidden from 768px up, where nobody calls from the keyboard.
 */
function Phone({ label, scroller, bar, startAt, children }: { label: string; scroller: RefObject<HTMLDivElement | null>; bar: ReactNode; startAt?: string; children: ReactNode }): React.JSX.Element {
  // Start with a section at the top of the screen, so the first thing on show is the bar in place and not a page cut through a button.
  useEffect(() => {
    const node = scroller.current;
    const target = startAt ? node?.querySelector<HTMLElement>(`#${startAt}`) : null;
    if (node && target) node.scrollTo({ top: target.offsetTop - 12 });
  }, [scroller, startAt]);
  return (
    <div className="relative mx-auto w-full max-w-[24.375rem] overflow-hidden rounded-[2rem] border-[4px] border-foreground/15 bg-background sm:rounded-[2.5rem] sm:border-[7px]">
      <div ref={scroller} tabIndex={0} role="region" aria-label={label} className="relative h-[35rem] overflow-y-auto overscroll-contain outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:ring-inset">
        {children}
      </div>
      {bar}
    </div>
  );
}

function SalonPage({ prefix }: { prefix: string }): React.JSX.Element {
  return (
    <div>
      <div className="flex items-center justify-between px-5 py-4">
        <span className="font-semibold tracking-[-0.03em]">Studio Lumen</span>
        <IconMenu aria-hidden="true" className="size-5 text-muted-foreground" />
      </div>
      <section className="px-5 pt-6 pb-10">
        <p className="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">Hair salon, Amersfoort</p>
        <h2 className="mt-3 text-4xl leading-[1.04] font-medium tracking-[-0.045em] text-balance">Cut, colour and a quiet chair.</h2>
        <p className="mt-4 text-sm leading-relaxed text-pretty text-muted-foreground">Four stylists, no walk-in rush, and an appointment that starts when you sit down.</p>
        <Button size="lg" className="mt-6 w-full">
          See our prices
        </Button>
      </section>
      <section id={`${prefix}-prices`} className="border-t border-border px-5 py-8">
        <h3 className="text-lg font-semibold tracking-[-0.02em]">Prices</h3>
        <dl className="mt-4 divide-y divide-border text-sm">
          {[
            ["Cut and finish", "€48"],
            ["Colour, full head", "€92"],
            ["Balayage", "€140"],
            ["Children under 12", "€26"],
            ["Beard trim", "€22"],
          ].map(([name, price]) => (
            <div key={name} className="flex items-center justify-between py-3">
              <dt>{name}</dt>
              <dd className="font-medium tabular-nums">{price}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section className="border-t border-border px-5 py-8">
        <h3 className="text-lg font-semibold tracking-[-0.02em]">What clients say</h3>
        <figure className="mt-4 rounded-xl border border-border p-4">
          <div role="img" aria-label="Five out of five stars" className="flex gap-0.5 text-foreground [&_svg]:size-3.5">
            {[0, 1, 2, 3, 4].map((star) => (
              <IconStar key={star} aria-hidden="true" className="fill-current" />
            ))}
          </div>
          <blockquote className="mt-3 text-sm leading-relaxed text-pretty">The first stylist who listened to what I did not want. Booked again before I left.</blockquote>
          <figcaption className="mt-3 text-xs text-muted-foreground">Marieke, Hoogland</figcaption>
        </figure>
      </section>
      <section className="border-t border-border px-5 py-8">
        <h3 className="text-lg font-semibold tracking-[-0.02em]">Opening hours</h3>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Tuesday to Friday, 9:00 to 18:00.</p>
        <p className="text-sm leading-relaxed text-muted-foreground">Saturday, 9:00 to 16:00. Closed Sunday and Monday.</p>
      </section>
      <p className="px-5 pt-4 pb-8 text-xs text-muted-foreground">&copy; 2026 Studio Lumen. Hof 14, Amersfoort.</p>
    </div>
  );
}

function Caption({ children }: { children: ReactNode }): React.JSX.Element {
  return <p className="mx-auto mb-5 max-w-[24.375rem] px-4 text-xs leading-relaxed text-muted-foreground sm:px-0 lg:min-h-[4.5rem]">{children}</p>;
}
