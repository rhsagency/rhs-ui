import type { ReactNode } from "react";

import { IconArrowUpRight, IconBell, IconBraces, IconCalendarCheck, IconHistory, IconKey, IconShieldCheck } from "@rhs-ui/icons";
import { HairlineGrid, HairlineGridCell } from "@rhs-ui/primitives/hairline-grid";
import { cn } from "@/lib/utils";

const FEATURES = [
  { icon: IconCalendarCheck, title: "Scheduled exports", text: "Send any report to Slack or email every Monday at 08:00, in the timezone of whoever reads it." },
  { icon: IconHistory, title: "Audit log", text: "Every change with who made it and when, kept for 400 days and exportable as CSV." },
  { icon: IconKey, title: "Single sign-on", text: "SAML and OIDC with just-in-time provisioning, so new hires land in the right team." },
  { icon: IconShieldCheck, title: "Role-based access", text: "Viewer, editor and owner on every workspace, with approvals for anything destructive." },
  { icon: IconBell, title: "Usage alerts", text: "A quiet nudge at 80 percent of a plan limit, long before anyone is blocked." },
  { icon: IconBraces, title: "API and webhooks", text: "Everything in the app is in the API, with signed webhooks and a sandbox key per project." },
] as const;

const STATS = [
  { label: "Uptime, 12 months", value: "99.98%", note: "Measured every 30 seconds" },
  { label: "Median export time", value: "1.2 s", note: "For a 50,000 row report" },
  { label: "Teams on Halcyon", value: "2,184", note: "In 61 countries" },
  { label: "Integrations", value: "74", note: "Twelve added this year" },
  { label: "Support reply", value: "9 min", note: "Median, weekdays" },
] as const;

/** A mark and a name, drawn from simple shapes: no real brands. */
function Wordmark({ name, mark, className }: { name: string; mark: ReactNode; className?: string }): React.JSX.Element {
  return (
    <span className={cn("inline-flex items-center gap-2 text-foreground/70", className)}>
      <svg viewBox="0 0 20 20" className="size-5 shrink-0" fill="currentColor" aria-hidden="true">
        {mark}
      </svg>
      <span>{name}</span>
    </span>
  );
}

const LOGOS = [
  <Wordmark key="northwind" name="Northwind" mark={<path d="M3 17V3l7 9V3m0 14V3l7 14V3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />} className="text-lg font-semibold tracking-[-0.03em]" />,
  <Wordmark key="kestrel" name="KESTREL" mark={<path d="M2 14 10 4l8 10-8-3.5Z" />} className="text-sm font-semibold tracking-[0.22em]" />,
  <Wordmark key="halcyon" name="halcyon" mark={<circle cx="10" cy="10" r="7" fill="none" stroke="currentColor" strokeWidth="2.5" />} className="text-xl font-medium tracking-[-0.04em]" />,
  <Wordmark key="meridian" name="Meridian" mark={<path d="M10 2v16M2 10h16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />} className="text-xl font-medium tracking-[-0.02em] italic" />,
  <Wordmark key="alder" name="Alder & Co" mark={<rect x="3" y="3" width="14" height="14" rx="3" />} className="text-lg font-bold tracking-[-0.04em]" />,
  <Wordmark key="fjordline" name="fjordline" mark={<path d="M2 12c3-6 5 6 8 0s5 6 8 0" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />} className="text-base font-medium tracking-[0.06em]" />,
  <Wordmark key="brightwell" name="Brightwell" mark={<path d="M10 2l2.4 5.6L18 10l-5.6 2.4L10 18l-2.4-5.6L2 10l5.6-2.4Z" />} className="text-lg font-semibold tracking-[-0.02em]" />,
];

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 gap-4">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-14 px-6 py-14 sm:py-20">
      <Example caption="A framed feature grid. Every cell is a link: hover and focus stay inside their own cell.">
        <HairlineGrid bordered columns={{ base: 1, sm: 2, lg: 3 }}>
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <HairlineGridCell key={title} asChild>
              <a href="#" className="group/feature flex flex-col">
                <span className="flex items-start justify-between">
                  <span className="inline-flex size-9 items-center justify-center rounded-lg border border-border bg-background text-foreground">
                    <Icon className="size-[1.125rem]" />
                  </span>
                  <IconArrowUpRight aria-hidden="true" className="size-4 -translate-x-1 translate-y-1 text-muted-foreground opacity-0 transition-[opacity,transform] duration-200 group-hover/feature:translate-x-0 group-hover/feature:translate-y-0 group-hover/feature:opacity-100 group-focus-visible/feature:translate-x-0 group-focus-visible/feature:translate-y-0 group-focus-visible/feature:opacity-100 motion-reduce:transition-none" />
                </span>
                <span className="mt-5 text-[0.9375rem] font-medium tracking-[-0.01em]">{title}</span>
                <span className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{text}</span>
              </a>
            </HairlineGridCell>
          ))}
        </HairlineGrid>
      </Example>

      <Example caption="Seven logos in four columns. The short last row is filled, with no grey slot and no line that leads nowhere.">
        <HairlineGrid as="ul" bordered padding="none" columns={{ base: 2, md: 4 }} aria-label="Customers">
          {LOGOS.map((logo, index) => (
            <HairlineGridCell key={index} as="li" className="flex h-24 items-center justify-center">
              {logo}
            </HairlineGridCell>
          ))}
        </HairlineGrid>
      </Example>

      <Example caption="A stat strip with minCell and no frame: the hairlines only run between cells, and on a phone the short last row is filled too.">
        <HairlineGrid as="ul" minCell={9} padding="lg">
          {STATS.map((stat) => (
            <HairlineGridCell key={stat.label} as="li" className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">{stat.label}</span>
              <span className="mt-2 text-3xl font-medium tracking-[-0.04em] tabular-nums">{stat.value}</span>
              <span className="text-xs text-muted-foreground">{stat.note}</span>
            </HairlineGridCell>
          ))}
        </HairlineGrid>
      </Example>
    </div>
  );
}
