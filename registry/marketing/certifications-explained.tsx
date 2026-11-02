import type { ComponentProps, ReactNode } from "react";

import { IconExternal, IconInfo } from "@rhs-ui/icons";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@rhs-ui/primitives/card";
import { DescriptionList, type DescriptionItem } from "@rhs-ui/primitives/description-list";
import { SectionHeading } from "@rhs-ui/primitives/section-heading";
import { cn } from "@/lib/utils";

export interface Certification {
  /** A stable id for the label. It keys the card, so it must be unique. */
  id: string;
  /** What the label is called, as it appears on the pack: "EU Organic". It is the card's heading. */
  name: string;
  /** Who grants it: "European Commission". It is written under the name. */
  issuer: string;
  /** What it means, in one plain sentence a customer could repeat without the standard in front of them. */
  meaning: string;
  /** The registration or certificate number, in monospace: "NL-BIO-01.2349". Leave it out when the label has none. */
  number?: string;
  /** Since when you hold it: a year ("2019") or a day ("2021-04-12"). A day is written in the `locale` and `timeZone` you pass. */
  since?: string;
  /** Where anyone can check it, ideally the registry's own page for your number. The card gets a Verify link that opens in a new tab, and says so. */
  verifyHref?: string;
  /** The seal as an image or an SVG, drawn at 48px. Leave it out and a typographic mark is drawn from the name. It is decoration: the name is written. */
  mark?: ReactNode;
}

export interface CertificationsExplainedLabels {
  /** The words before the issuer. */
  issuedBy: string;
  /** The term for what the label means. */
  meaning: string;
  /** The term for the registration number. */
  number: string;
  /** The term for the date. */
  since: string;
  /** The text of the link that checks the label. A screen reader also hears the name and that it opens in a new tab. */
  verify: string;
  /** Read out after the name in the link: "opens in a new tab". */
  newTab: string;
}

export interface CertificationsExplainedProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** The small line over the heading: "Our labels". */
  eyebrow?: string;
  /** The heading: "What the labels on our packs mean". */
  title: string;
  /** One or two sentences under the heading. */
  description?: string;
  /** The labels you hold, one card each. Two, three or six sit best. */
  certifications: readonly Certification[];
  /** A line under the cards: how often the labels are audited, or what to do if one cannot be verified. */
  footnote?: ReactNode;
  /** The level of the heading: 2 by default. The name of each label sits one level below. */
  headingLevel?: 2 | 3;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<CertificationsExplainedLabels>;
  /** Locale for a date in `since`. */
  locale?: string;
  /** Time zone for a date in `since`. A date is a calendar day, so UTC (the default) shows the day you wrote. */
  timeZone?: string;
}

const LABELS: CertificationsExplainedLabels = {
  issuedBy: "Issued by",
  meaning: "What it means",
  number: "Registration number",
  since: "Certified since",
  verify: "Verify",
  newTab: "opens in a new tab",
};

const LINK =
  "group/link inline-flex w-fit items-center gap-1.5 rounded-sm text-sm font-medium text-foreground underline decoration-foreground/30 underline-offset-4 outline-none transition-colors duration-150 hover:decoration-current focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none";

/**
 * The columns of the grid, from the number of labels, as whole literal classes: one card is not stretched, two or
 * four sit in pairs, and any other number fills three columns on a wide block. A grid never leaves an empty column.
 */
function gridColumns(count: number): string {
  if (count === 1) return "max-w-md";
  if (count === 2 || count === 4) return "@2xl:grid-cols-2";
  return "@2xl:grid-cols-2 @5xl:grid-cols-3";
}

/**
 * Letters for the typographic seal. An acronym stands as it is (EU, ISO, FSC); otherwise the first letters of the
 * first two words ("B Corp Certified" gives BC), or the first two letters of a single word ("Fairtrade" gives FA).
 */
function abbreviation(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const first = words[0] ?? "";
  if (/^[A-Z0-9]{2,4}$/.test(first)) return first;
  const initials = words
    .filter((word) => /^\p{L}/u.test(word))
    .slice(0, 2)
    .map((word) => word.charAt(0));
  return (initials.length > 1 ? initials.join("") : first.slice(0, 2)).toUpperCase();
}

/** A year stays a year; a day is written the way the reader's locale writes it; anything else is shown as it came. */
function sinceText(value: string, locale: string, timeZone: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone }).format(date);
}

/** The seal: what you pass, or two thin rings round the letters of the name, like a stamp. */
function Seal({ certification }: { certification: Certification }): React.JSX.Element {
  if (certification.mark) {
    return (
      <span aria-hidden="true" className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-full text-foreground [&_img]:size-full [&_img]:object-contain [&_svg]:size-full">
        {certification.mark}
      </span>
    );
  }
  return (
    <span
      aria-hidden="true"
      className="relative grid size-12 shrink-0 place-items-center rounded-full border border-foreground text-[0.8125rem] font-semibold tracking-[0.02em] before:absolute before:inset-[3px] before:rounded-full before:border before:border-border"
    >
      {abbreviation(certification.name)}
    </span>
  );
}

/**
 * Labels in plain words: what each certification means, who issues it, its number and where to check it. A grid of
 * cards closes the gap between a row of badges and understanding them, for food, organic, safety and professional
 * bodies. Each card has the label's name as its heading with the issuer under it, and a description list so the
 * facts read as pairs: what it means in one plain sentence, the registration number in monospace and the date it
 * has been held since. A Verify link opens the registry in a new tab and says so. No seal image is required: when
 * you pass none, a typographic mark is drawn from the name. A fact you leave out is simply not shown. No state and no
 * script: it renders on the server. The cards come in one, two or three columns by the width of the block and the
 * number of labels (one label is a single card, two or four sit in pairs, so no column is ever left empty), and the
 * facts sit in two columns when a card is wide enough.
 */
export function CertificationsExplained({ eyebrow, title, description, certifications, footnote, headingLevel = 2, labels: custom, locale = "en-US", timeZone = "UTC", className, ...props }: CertificationsExplainedProps) {
  const labels = { ...LABELS, ...custom };
  const Name = `h${headingLevel + 1}` as "h3" | "h4";

  return (
    <section data-slot="certifications-explained" className={cn("@container w-full break-words", className)} {...props}>
      <SectionHeading eyebrow={eyebrow} title={title} description={description} as={headingLevel === 3 ? "h3" : "h2"} />

      <ul role="list" className={cn("mt-10 grid gap-5 @3xl:mt-12", gridColumns(certifications.length))}>
        {certifications.map((certification) => {
          const facts: DescriptionItem[] = [{ term: labels.meaning, value: <span className="text-[0.9375rem] leading-relaxed font-normal text-pretty">{certification.meaning}</span> }];
          if (certification.number) {
            facts.push({ term: labels.number, value: <span className="font-mono text-[0.8125rem] tracking-[-0.01em] [overflow-wrap:anywhere]">{certification.number}</span> });
          }
          if (certification.since) {
            facts.push({
              term: labels.since,
              value: <time dateTime={/^\d{4}(-\d{2}-\d{2})?$/.test(certification.since) ? certification.since : undefined}>{sinceText(certification.since, locale, timeZone)}</time>,
            });
          }
          return (
            <li key={certification.id} className="flex">
              <Card className="@container w-full gap-5 py-6">
                <CardHeader className="flex items-center gap-4">
                  <Seal certification={certification} />
                  <div className="min-w-0">
                    <CardTitle asChild>
                      <Name className="text-lg leading-snug tracking-[-0.02em]">{certification.name}</Name>
                    </CardTitle>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {labels.issuedBy} {certification.issuer}
                    </p>
                  </div>
                </CardHeader>
                <CardContent>
                  <DescriptionList layout="stacked" items={facts} className="gap-4 @xs:grid-cols-2 @xs:[&>div:first-child]:col-span-2" />
                </CardContent>
                {certification.verifyHref ? (
                  <CardFooter className="mt-auto">
                    <a href={certification.verifyHref} target="_blank" rel="noopener noreferrer" className={LINK}>
                      <span>
                        {labels.verify}
                        <span className="sr-only">
                          {" "}
                          {certification.name}, {labels.newTab}
                        </span>
                      </span>
                      <IconExternal aria-hidden="true" className="size-3.5 transition-transform duration-150 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 motion-reduce:transition-none" />
                    </a>
                  </CardFooter>
                ) : null}
              </Card>
            </li>
          );
        })}
      </ul>

      {footnote ? (
        <p className="mt-6 flex max-w-3xl gap-2.5 text-sm leading-relaxed text-muted-foreground">
          <IconInfo aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span className="min-w-0">{footnote}</span>
        </p>
      ) : null}
    </section>
  );
}
