"use client";

import { useEffect, useRef } from "react";

import { FooterCurtain } from "@rhs-ui/marketing/footer-curtain";
import { FooterSection } from "@rhs-ui/marketing/footer-section";
import { Button } from "@rhs-ui/primitives/button";

const PLANS = [
  { name: "Starter", price: "€0", note: "For a first project" },
  { name: "Studio", price: "€29", note: "For a team of up to ten" },
  { name: "Agency", price: "€99", note: "For many clients, many sites" },
] as const;

/** How far from the end of the scroll each stop is, in pixels: the footer is 300px or more tall, so 40 lifts the page off all but the top edge of it, and the closing block of the page above it is still whole. */
const STOPS = [
  { label: "At rest", fromEnd: Number.POSITIVE_INFINITY },
  { label: "Lifting", fromEnd: 40 },
  { label: "Uncovered", fromEnd: 0 },
] as const;

export default function Demo(): React.JSX.Element {
  const scroller = useRef<HTMLDivElement>(null);

  const scrollTo = (fromEnd: number, smooth: boolean) => {
    const element = scroller.current;
    if (!element) return;
    const top = Number.isFinite(fromEnd) ? Math.max(0, element.scrollHeight - element.clientHeight - fromEnd) : 0;
    element.scrollTo({ top, behavior: smooth && !window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "smooth" : "auto" });
  };

  // The preview starts part-way, with the page lifting off the footer.
  useEffect(() => {
    scrollTo(40, false);
  }, []);

  return (
    <div className="mx-auto grid max-w-5xl gap-4 px-6 py-6">
      <p className="max-w-3xl text-xs leading-relaxed text-muted-foreground">
        The footer is stuck to the bottom of the window beneath the page, and the page is an opaque layer that slides up off it as you scroll: nothing here is script, it is sticky positioning and stacking. Scroll the frame, or use the buttons. In a window shorter than minViewportHeight the footer would be cut off, so the effect switches off there and the footer follows the page as usual.
      </p>
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Scroll position of the frame">
        {STOPS.map((stop) => (
          <Button key={stop.label} size="sm" variant="outline" type="button" onClick={() => scrollTo(stop.fromEnd, true)}>
            {stop.label}
          </Button>
        ))}
      </div>
      <div role="group" aria-label="Page with a curtain footer" className="relative overflow-hidden rounded-xl border border-border bg-background">
        {/* The frame is focusable, so a keyboard can scroll it as it would scroll the window of your page. */}
        <div ref={scroller} tabIndex={0} className="relative h-[42rem] overflow-y-auto overscroll-contain outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:ring-inset sm:h-[34rem]">
          <FooterCurtain
            minViewportHeight={400}
            footer={
              <FooterSection
                className="bg-muted"
                brand={<span className="text-lg font-semibold tracking-[-0.03em]">Halcyon</span>}
                columns={[
                  {
                    title: "Product",
                    links: [
                      { label: "Scheduling", href: "#scheduling" },
                      { label: "Reminders", href: "#reminders" },
                      { label: "Reports", href: "#reports" },
                    ],
                  },
                  {
                    title: "Company",
                    links: [
                      { label: "About", href: "#about" },
                      { label: "Careers", href: "#careers" },
                      { label: "Contact", href: "#contact" },
                    ],
                  },
                ]}
                legal="© 2026 Halcyon Scheduling B.V."
                legalLinks={[
                  { label: "Privacy", href: "#privacy" },
                  { label: "Terms", href: "#terms" },
                ]}
              />
            }
          >
            <div className="px-6 py-14 sm:px-10">
              <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">Plans</p>
              <h2 className="mt-4 max-w-xl text-3xl leading-[1.06] font-medium tracking-[-0.04em] text-balance sm:text-4xl">Pick the size of the week you want to keep true.</h2>
              <p className="mt-4 max-w-md text-[0.9375rem] leading-relaxed text-muted-foreground">Every plan has the planner, the reminders and the reports. You pay for how many people and clients share them.</p>
            </div>
            <ul className="grid gap-4 px-6 pb-14 sm:grid-cols-3 sm:px-10">
              {PLANS.map((plan) => (
                <li key={plan.name} className="rounded-xl border border-border bg-card p-5 text-card-foreground">
                  <p className="text-sm font-medium">{plan.name}</p>
                  <p className="mt-6 text-3xl font-medium tracking-[-0.045em] tabular-nums">
                    {plan.price}
                    <span className="text-sm font-normal tracking-normal text-muted-foreground"> / month</span>
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">{plan.note}</p>
                </li>
              ))}
            </ul>
            <div className="border-t border-border px-6 py-14 sm:px-10">
              <h2 className="max-w-md text-2xl font-medium tracking-[-0.035em] text-balance">Ready when you are. Nothing to install, nothing to import.</h2>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">Start on the free plan and move up when the calendar fills; your data comes with you.</p>
            </div>
          </FooterCurtain>
        </div>
      </div>
    </div>
  );
}
