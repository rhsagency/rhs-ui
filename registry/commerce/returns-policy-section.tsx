import type { ComponentProps, ElementType, ReactNode } from "react";

import { IconCheck, IconClipboardList, IconClose, IconMail, IconPackage, IconPin, IconReceipt } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { Callout } from "@rhs-ui/primitives/callout";
import { DescriptionList, type DescriptionItem } from "@rhs-ui/primitives/description-list";
import { Separator } from "@rhs-ui/primitives/separator";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@rhs-ui/primitives/table";
import { cn } from "@/lib/utils";

export interface ReturnStep {
  /** "Request", "Pack", "Drop off", "Refund". */
  title: string;
  /** One or two sentences on what the customer does. */
  description: string;
  /** The step's icon. Drawn at 18px, decorative. */
  icon?: ReactNode;
}

export interface RefundTime {
  /** How the order was paid: "Card", "Bank transfer", "Store credit". */
  method: string;
  /** When the money is back, as people say it: "3 to 5 working days", "Straight away". */
  time: string;
  /** A line under the time: what it depends on. */
  note?: string;
}

export interface ReturnsNotice {
  /** The callout's title. */
  title: string;
  /** What to know. May hold a link. */
  body: ReactNode;
  /** The callout's tone. Defaults to "note", the plain information icon: a problem report or a deadline is not a tip. */
  tone?: "note" | "tip" | "warning";
}

export interface ReturnsPolicyLabels {
  /** The small line above the headline. */
  eyebrow?: string;
  /** The headline. `{days}` is the window in days. */
  headline?: string;
  /** The rule in words, under the headline. `{days}`. */
  rule?: string;
  /** The title of the steps. */
  stepsTitle?: string;
  /** Before a step's number, for a screen reader. */
  step?: string;
  /** The title of the list of what can be returned. */
  eligibleTitle?: string;
  /** The title of the list of what cannot. */
  excludedTitle?: string;
  /** The title of the refund table. */
  refundTitle?: string;
  /** The head of the first column of the refund table. */
  refundMethod?: string;
  /** The head of the second column. */
  refundArrives?: string;
  /** The button. */
  start?: string;
  /** Before the contact link. */
  questions?: string;
  /** Labels of the facts beside the headline, when they are the defaults. */
  facts?: { window?: string; shipping?: string; condition?: string };
}

const WORDS = {
  eyebrow: "Returns",
  headline: "{days} days to change your mind",
  rule: "The clock starts the day your order is delivered, and that day counts as the first. Start your return on or before day {days} and you get a full refund.",
  stepsTitle: "How a return works",
  step: "Step",
  eligibleTitle: "Can be returned",
  excludedTitle: "Cannot be returned",
  refundTitle: "When your refund arrives",
  refundMethod: "You paid with",
  refundArrives: "Money is back within",
  start: "Start a return",
  questions: "Questions about a return?",
  facts: { window: "Return window", shipping: "Return shipping", condition: "Condition" },
} satisfies Required<ReturnsPolicyLabels>;

const STEPS: readonly ReturnStep[] = [
  { title: "Request", description: "Start the return online with your order number and say what is going back. It takes about two minutes.", icon: <IconClipboardList /> },
  { title: "Pack", description: "Put everything back in its original packaging with the tags on. The prepaid label is in your confirmation email.", icon: <IconPackage /> },
  { title: "Drop off", description: "Hand the parcel in at any pick-up point or post office, and keep the receipt until your refund has arrived.", icon: <IconPin /> },
  { title: "Refund", description: "When the parcel is back and checked, the money goes to the way you paid. We email you the day it leaves.", icon: <IconReceipt /> },
];

const ELIGIBLE: readonly ReactNode[] = [
  "Clothing and shoes that are unworn, with the tags still on",
  "Home and kitchen items in their original packaging",
  "Items that arrived faulty or damaged, for as long as the legal guarantee runs",
  "Gifts, for store credit, with the gift receipt",
];

const EXCLUDED: readonly ReactNode[] = [
  "Underwear, swimwear and socks once the hygiene seal is broken",
  "Made-to-order and personalised items",
  "Gift cards and digital downloads",
  "Anything washed, worn or damaged through use",
];

const REFUNDS: readonly RefundTime[] = [
  { method: "Card", time: "3 to 5 working days", note: "Your bank may take a little longer to show it." },
  { method: "Bank transfer", time: "1 to 3 working days" },
  { method: "Store credit", time: "Straight away", note: "It never expires and works on every order." },
];

export interface ReturnsPolicySectionProps extends Omit<ComponentProps<"section">, "children" | "title"> {
  /** How many days after delivery a return can be started. The default is 30. */
  windowDays?: number;
  /** The facts beside the headline, as terms and values. Without them: the window, the return shipping and the condition. */
  facts?: readonly DescriptionItem[];
  /** The steps of a return, in order. Four read best. Without them the section tells the usual four. */
  steps?: readonly ReturnStep[];
  /** What can be returned, one line each. */
  eligible?: readonly ReactNode[];
  /** What cannot be returned, one line each. */
  excluded?: readonly ReactNode[];
  /** When the money is back, by the way it was paid. */
  refundTimes?: readonly RefundTime[];
  /** Where the customer starts a return. The button is left out without it. */
  startHref?: string;
  /** How to reach someone: a label such as the address, its link and a line on when they reply. */
  contact?: { label: string; href: string; detail?: string };
  /** A callout under the refund table: a faulty item, a deadline, a different rule abroad. */
  notice?: ReturnsNotice;
  /** The headline's element: "h2" (the default) inside a page, "h1" when this is the page. The titles of the parts sit one level below. */
  headingAs?: "h1" | "h2";
  /** Renders the start button and the contact link. Defaults to "a"; pass your router's Link. */
  linkAs?: ElementType;
  /** Locale for the number of days. Always passed, so server and browser agree. */
  locale?: string;
  /** The words, for another language or other legal wording. */
  labels?: ReturnsPolicyLabels;
}

const fill = (template: string, values: Record<string, string>): string => template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

/**
 * Returns explained for people, so the question "can I send this back?" is answered before it becomes a ticket:
 * the window as a headline fact with the rule for counting in words, four steps drawn as a numbered strip with
 * icons, two lists of what can and cannot be returned (each line has a check or a cross and the words, never
 * only a colour), when the refund arrives by the way it was paid, and the action to start. The copy it starts
 * with is real and ready to ship; every line is a prop, so the legal wording can be swapped for each shop.
 */
export function ReturnsPolicySection({
  windowDays = 30,
  facts,
  steps = STEPS,
  eligible = ELIGIBLE,
  excluded = EXCLUDED,
  refundTimes = REFUNDS,
  startHref,
  contact,
  notice,
  headingAs: Heading = "h2",
  linkAs: Link = "a",
  locale = "en-US",
  labels,
  className,
  ...props
}: ReturnsPolicySectionProps) {
  const words = { ...WORDS, ...labels, facts: { ...WORDS.facts, ...labels?.facts } };
  const days = new Intl.NumberFormat(locale).format(windowDays);
  const Sub = Heading === "h1" ? "h2" : "h3";
  const Item = Heading === "h1" ? "h3" : "h4";
  const shown: readonly DescriptionItem[] = facts ?? [
    { term: words.facts.window, value: `${days} days from delivery` },
    { term: words.facts.shipping, value: "Free with the prepaid label" },
    { term: words.facts.condition, value: "Unworn, with the tags on" },
  ];

  const lists = [
    { title: words.eligibleTitle, lines: eligible, icon: <IconCheck />, tile: "bg-foreground text-background" },
    { title: words.excludedTitle, lines: excluded, icon: <IconClose />, tile: "border border-border bg-muted text-foreground" },
  ].filter((list) => list.lines.length > 0);

  return (
    <section data-slot="returns-policy-section" className={cn("py-12 sm:py-16", className)} {...props}>
      <header className={cn("grid gap-10 lg:items-end lg:gap-16", shown.length > 0 && "lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]")}>
        <div className="min-w-0">
          <p className="mb-5 text-xs font-medium tracking-[.18em] text-muted-foreground uppercase">{words.eyebrow}</p>
          <Heading className="text-4xl leading-[1.05] font-medium tracking-[-.045em] text-balance sm:text-5xl">{fill(words.headline, { days })}</Heading>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground text-pretty">{fill(words.rule, { days })}</p>
        </div>
        {shown.length > 0 ? <DescriptionList items={shown} className="rounded-xl border border-border bg-card px-5 py-1 [&>div]:py-3.5 [&>div]:first:pt-3.5 [&>div]:last:pb-3.5" /> : null}
      </header>

      <Separator className="my-10 sm:my-12" />

      <div className="grid gap-12">
        {steps.length > 0 ? (
          <div>
            <Sub className="text-lg font-medium tracking-[-.02em]">{words.stepsTitle}</Sub>
            <ol className="mt-6 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((step, index) => (
                <li key={step.title} className="border-t border-foreground pt-5">
                  <div className="flex items-center gap-3">
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-foreground text-sm font-medium text-background tabular-nums">
                      <span className="sr-only">{words.step} </span>
                      {index + 1}
                    </span>
                    {step.icon ? (
                      <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-full border border-border text-muted-foreground [&_svg]:size-[18px]">
                        {step.icon}
                      </span>
                    ) : null}
                  </div>
                  <Item className="mt-4 text-base font-medium">{step.title}</Item>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
                </li>
              ))}
            </ol>
          </div>
        ) : null}

        {lists.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2">
            {lists.map((list) => (
              <div key={list.title} className="rounded-xl border border-border bg-card p-6">
                <Sub className="flex items-center gap-3 text-base font-medium">
                  <span aria-hidden="true" className={cn("grid size-6 shrink-0 place-items-center rounded-full [&_svg]:size-3.5", list.tile)}>
                    {list.icon}
                  </span>
                  {list.title}
                </Sub>
                <ul className="mt-5 grid gap-3.5">
                  {list.lines.map((line, index) => (
                    <li key={index} className="flex items-start gap-3 text-sm leading-relaxed">
                      <span aria-hidden="true" className="mt-0.5 shrink-0 text-muted-foreground [&_svg]:size-4">
                        {list.icon}
                      </span>
                      <span className="min-w-0">{line}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : null}

        {refundTimes.length > 0 || notice ? (
          <div className="grid gap-5">
            {refundTimes.length > 0 ? (
              <div className="overflow-hidden rounded-xl border border-border bg-card">
                <Table className="caption-top">
                  <TableCaption className="mt-0 px-5 pt-5 pb-3 text-left text-base font-medium tracking-[-.01em] text-foreground">{words.refundTitle}</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead scope="col" className="w-[40%] pl-5">
                        {words.refundMethod}
                      </TableHead>
                      <TableHead scope="col" className="pr-5">
                        {words.refundArrives}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {refundTimes.map((row) => (
                      <TableRow key={row.method}>
                        <TableHead scope="row" className="h-auto py-4 pl-5 align-top text-sm font-medium whitespace-normal text-foreground">
                          {row.method}
                        </TableHead>
                        <TableCell className="py-4 pr-5 align-top">
                          <span className="font-medium tabular-nums">{row.time}</span>
                          {row.note ? <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{row.note}</span> : null}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : null}
            {notice ? (
              <Callout tone={notice.tone ?? "note"} title={notice.title}>
                {notice.body}
              </Callout>
            ) : null}
          </div>
        ) : null}

        {startHref || contact ? (
          <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-5 border-t border-border pt-8">
            {contact ? (
              <p className="flex min-w-0 items-start gap-3 text-sm text-muted-foreground">
                <IconMail aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                <span className="min-w-0">
                  {words.questions}{" "}
                  <Link href={contact.href} className="inline-block max-w-full rounded-sm font-medium text-foreground underline underline-offset-4 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40">
                    {contact.label}
                  </Link>
                  {contact.detail ? <span className="block">{contact.detail}</span> : null}
                </span>
              </p>
            ) : (
              <span />
            )}
            {startHref ? (
              <Button asChild size="lg">
                <Link href={startHref}>{words.start}</Link>
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
