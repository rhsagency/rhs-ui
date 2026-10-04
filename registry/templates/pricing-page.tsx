"use client";
import { Fragment } from "react";

import { DotField } from "@rhs-ui/backgrounds/dot-field";
import { IconBuilding, IconCheck, IconMinus } from "@rhs-ui/icons";
import { FaqSection } from "@rhs-ui/marketing/faq-section";
import { PricingSection, type PricingPlan } from "@rhs-ui/marketing/pricing-section";
import { Reveal } from "@rhs-ui/motion/reveal";
import { Marquee } from "@rhs-ui/primitives/marquee";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@rhs-ui/primitives/table";

export interface ComparisonGroup { title: string; rows: readonly { feature: string; values: readonly (boolean | string)[] }[] }

export interface PricingPageProps {
  product?: string;
  plans?: readonly PricingPlan[];
  comparison?: readonly ComparisonGroup[];
  questions?: readonly { id: string; question: string; answer: string }[];
  onSelectPlan?: (id: string, interval: "monthly" | "yearly") => void;
}

const PLANS: PricingPlan[] = [
  { id: "free", name: "Free", description: "For one person trying it out.", monthlyPrice: 0, yearlyPrice: 0, currency: "EUR", features: ["3 projects", "1 GB storage", "Community support"], action: "Start free" },
  { id: "pro", name: "Pro", description: "For professionals who ship every week.", monthlyPrice: 16, yearlyPrice: 160, currency: "EUR", features: ["Unlimited projects", "100 GB storage", "Version history", "Email support"], featured: true, action: "Start trial" },
  { id: "team", name: "Team", description: "For teams that work in the same files.", monthlyPrice: 32, yearlyPrice: 320, currency: "EUR", features: ["Everything in Pro", "Shared libraries", "Roles and permissions", "Priority support"], action: "Start trial" },
];

const COMPARISON: ComparisonGroup[] = [
  { title: "Work", rows: [{ feature: "Projects", values: ["3", "Unlimited", "Unlimited"] }, { feature: "Storage", values: ["1 GB", "100 GB", "1 TB"] }, { feature: "Version history", values: ["7 days", "1 year", "Unlimited"] }, { feature: "Offline mode", values: [false, true, true] }] },
  { title: "Together", rows: [{ feature: "Comments", values: [true, true, true] }, { feature: "Shared libraries", values: [false, false, true] }, { feature: "Roles and permissions", values: [false, false, true] }, { feature: "Guests", values: [false, "5", "Unlimited"] }] },
  { title: "Security and support", rows: [{ feature: "Two-factor sign-in", values: [true, true, true] }, { feature: "SSO", values: [false, false, true] }, { feature: "Support", values: ["Community", "Email", "Priority, 4 h"] }] },
];

const QUESTIONS = [
  { id: "trial", question: "How does the trial work?", answer: "Fourteen days of Pro or Team with every feature. No card needed; at the end you choose a plan or drop back to Free." },
  { id: "change", question: "Can I change plans later?", answer: "Any time. Upgrades apply right away and are prorated; downgrades apply at the end of your billing period." },
  { id: "vat", question: "Are prices with VAT?", answer: "Prices are without VAT. Businesses in the EU with a VAT number are reverse-charged." },
  { id: "students", question: "Do you have discounts?", answer: "Pro is free for students and teachers, and nonprofits get 50% off Team." },
];

const cell = (value: boolean | string) =>
  value === true ? <IconCheck size={16} aria-label="Included" className="mx-auto" /> : value === false ? <IconMinus size={16} aria-label="Not included" className="mx-auto text-muted-foreground/60" /> : value;

/**
 * A full pricing page: plans with a monthly and yearly toggle, customers, a
 * comparison table grouped by theme with every plan side by side, an
 * enterprise band, and the billing questions people ask.
 */
export function PricingPage({ product = "Canvas", plans = PLANS, comparison = COMPARISON, questions = QUESTIONS, onSelectPlan = () => undefined }: PricingPageProps): React.JSX.Element {
  return (
    <div data-slot="pricing-page" className="bg-background text-foreground">
      <nav aria-label="Product" className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5 text-sm sm:px-10">
          <a href="#pricing-top" className="font-semibold tracking-tight">{product}</a>
          <div className="hidden gap-7 text-muted-foreground sm:flex"><a href="#pricing-top">Product</a><a href="#pricing-top" aria-current="page" className="text-foreground">Pricing</a><a href="#pricing-top">Docs</a></div>
          <a href="#pricing-plans" className="rounded-full bg-foreground px-4 py-2 text-background">Start free</a>
        </div>
      </nav>

      <DotField className="border-b border-border [&>canvas]:opacity-50" speed={0.25}>
        <header id="pricing-top" className="mx-auto max-w-4xl px-6 pt-20 pb-10 text-center sm:px-10">
          <p className="font-mono text-[11px] tracking-widest text-muted-foreground uppercase">Pricing</p>
          <h1 className="mt-5 text-5xl font-semibold tracking-[-0.045em] sm:text-7xl">Simple plans. No surprises.</h1>
          <p className="mx-auto mt-6 max-w-lg text-base text-muted-foreground">Start free, upgrade when your work needs it, and pay less when you pay yearly.</p>
        </header>
        <section id="pricing-plans" className="mx-auto max-w-6xl scroll-mt-6 px-6 pb-20 sm:px-10">
          <PricingSection plans={plans} onSelect={onSelectPlan} />
        </section>
      </DotField>

      <section aria-label="Customers" className="py-12">
        <p className="mb-6 text-center text-sm text-muted-foreground">Used by 12,000 teams, including</p>
        <Marquee label="Customers" duration={34}>
          {["Meridian", "Kestrel", "Parallel", "Northwind", "Halcyon", "Oak Lane", "Fieldwork"].map((customer) => (
            <span key={customer} className="mx-12 text-2xl font-semibold tracking-tight text-muted-foreground">{customer}</span>
          ))}
        </Marquee>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16 sm:px-10">
        <Reveal>
          <h2 className="text-center text-4xl font-semibold tracking-[-0.03em]">Compare every plan</h2>
        </Reveal>
        <Reveal className="relative mt-10 overflow-x-auto rounded-2xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-2/5">Features</TableHead>
                {plans.map((plan) => (
                  <TableHead key={plan.id} className="text-center">
                    {plan.name}
                    {plan.featured ? <span className="ml-2 rounded-full bg-foreground px-2 py-0.5 text-[10px] text-background">Popular</span> : null}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {comparison.map((group) => (
                <Fragment key={group.title}>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableCell colSpan={plans.length + 1} className="font-mono text-[11px] tracking-widest text-muted-foreground uppercase">{group.title}</TableCell>
                  </TableRow>
                  {group.rows.map((row) => (
                    <TableRow key={row.feature}>
                      <TableCell>{row.feature}</TableCell>
                      {row.values.map((value, index) => (
                        <TableCell key={index} className="text-center">{cell(value)}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </Fragment>
              ))}
            </TableBody>
          </Table>
        </Reveal>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12 sm:px-10">
        <Reveal className="flex flex-wrap items-center justify-between gap-8 rounded-3xl bg-foreground p-10 text-background sm:p-12">
          <div>
            <h2 className="flex items-center gap-3 text-3xl font-semibold tracking-tight"><IconBuilding size={26} /> Enterprise</h2>
            <p className="mt-2 max-w-md text-sm opacity-70">SAML, audit logs, a data processing agreement, invoicing and a named contact. From 50 seats.</p>
          </div>
          <a href="mailto:sales@example.com" className="rounded-full bg-background px-6 py-3 text-sm text-foreground">Talk to sales</a>
        </Reveal>
      </section>

      <section className="mx-auto max-w-6xl px-6 sm:px-10">
        <FaqSection title="Billing questions" questions={questions} />
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl justify-between px-6 py-8 text-xs text-muted-foreground sm:px-10">
          <span>© 2026 {product}</span>
          <span>Prices in EUR, excluding VAT</span>
        </div>
      </footer>
    </div>
  );
}
