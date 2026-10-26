import { IconArrowRight, IconCheck, IconClose, IconShieldCheck } from "@rhs-ui/icons";
import { dayText, durationText, type WarrantyValues } from "@rhs-ui/commerce/warranty-registration/warranty";
import { fill, type WarrantyWords } from "@rhs-ui/commerce/warranty-registration/words";
import { Button } from "@rhs-ui/primitives/button";
import { DescriptionList, type DescriptionItem } from "@rhs-ui/primitives/description-list";
import { cn } from "@/lib/utils";

export interface WarrantyConfirmationProps {
  /** The id of the heading, so the section can be named by it. */
  titleId: string;
  /** The heading's element. */
  headingAs: "h2" | "h3";
  /** What was registered, with the last day of the cover. */
  values: WarrantyValues;
  /** The model line of the product, when it is known. */
  model?: string;
  /** How long the cover runs, in months. */
  months: number;
  /** What the warranty covers, one line each. The list is left out when empty. */
  covers?: readonly string[];
  /** What it does not cover, one line each. */
  excludes?: readonly string[];
  /** The registration's reference, when the shop gave one. */
  reference?: string;
  /** Where "Back to the shop" goes. Without it there is no link. */
  shopHref?: string;
  /** Every word the confirmation says. */
  words: WarrantyWords;
  /** The locale the dates are written in. */
  locale: string;
}

/**
 * What replaces the form once the product is registered: the end of the cover as the one big fact, what the
 * customer gave, what is covered and what is not, the reference and a way back to the shop. It keeps no state, so
 * it renders on the server too.
 */
export function WarrantyConfirmation({ titleId, headingAs: Heading, values, model, months, covers = [], excludes = [], reference, shopHref, words, locale }: WarrantyConfirmationProps) {
  const Sub = Heading === "h2" ? "h3" : "h4";
  const until = dayText(values.coveredUntil, locale);
  const bought = dayText(values.purchaseDate, locale);
  const duration = durationText(months, locale);

  const details: DescriptionItem[] = [
    { term: words.fields.product, value: <span className="[overflow-wrap:anywhere]">{values.product}</span> },
    ...(model ? [{ term: words.fields.model, value: <span className="tabular-nums [overflow-wrap:anywhere]">{model}</span> }] : []),
    { term: words.fields.serial, value: <span className="font-mono text-[0.8125rem] tracking-tight [overflow-wrap:anywhere]">{values.serial}</span> },
    { term: words.purchased, value: <span className="tabular-nums">{bought}</span> },
    { term: words.boughtAt, value: <span className="[overflow-wrap:anywhere]">{values.store}</span> },
    ...(values.proof ? [{ term: words.fields.proof, value: <span className="[overflow-wrap:anywhere]">{values.proof.name}</span> }] : []),
    ...(reference ? [{ term: words.reference, value: <span className="font-mono text-[0.8125rem] tracking-tight">{reference}</span> }] : []),
  ];

  const lists = [
    { title: words.coversTitle, lines: covers, icon: <IconCheck />, tile: "bg-foreground text-background" },
    { title: words.excludesTitle, lines: excludes, icon: <IconClose />, tile: "border border-border bg-muted text-foreground" },
  ].filter((list) => list.lines.length > 0);

  return (
    <div data-slot="warranty-registration-sent" className="grid gap-8">
      <header className="flex items-start gap-4">
        <span aria-hidden="true" className="grid size-11 shrink-0 place-items-center rounded-full bg-foreground text-background">
          <IconCheck className="size-5" strokeWidth={2.25} />
        </span>
        <div className="min-w-0">
          <Heading id={titleId} tabIndex={-1} data-focus-target="" className="text-2xl leading-tight font-medium tracking-[-0.035em] text-balance outline-none @3xl:text-3xl">
            {values.product ? fill(words.sentTitleNamed, { product: values.product }) : words.sentTitle}
          </Heading>
        </div>
      </header>

      <div className="grid gap-4 rounded-xl border border-foreground/80 bg-card p-6 shadow-xs @xl:grid-cols-[minmax(0,1fr)_auto] @xl:items-center @xl:p-7">
        <div className="min-w-0">
          <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">{words.sentCovered}</p>
          <p className="mt-2 text-3xl leading-none font-medium tracking-[-0.045em] tabular-nums @xl:text-4xl">{until}</p>
          <p className="mt-3 text-sm text-muted-foreground">{fill(words.sentFrom, { duration, date: bought })}</p>
        </div>
        <span aria-hidden="true" className="hidden size-14 shrink-0 place-items-center rounded-full border border-border bg-muted @xl:grid">
          <IconShieldCheck className="size-6" />
        </span>
      </div>

      <div role="group" aria-labelledby={`${titleId}-details`} className="grid gap-3">
        <Sub id={`${titleId}-details`} className="text-sm font-medium">
          {words.sentDetails}
        </Sub>
        <div className="rounded-xl border border-border bg-card px-5 py-5 shadow-xs">
          <DescriptionList layout="stacked" items={details} className="gap-x-8 gap-y-5 @md:grid-cols-2 @2xl:grid-cols-3" />
        </div>
      </div>

      {lists.length > 0 ? (
        <div className={cn("grid gap-8", lists.length > 1 && "@xl:grid-cols-2")}>
          {lists.map((list, index) => (
            <div role="group" key={list.title} aria-labelledby={`${titleId}-list-${index}`} className="grid content-start gap-3">
              <Sub id={`${titleId}-list-${index}`} className="text-sm font-medium">
                {list.title}
              </Sub>
              <ul role="list" className="grid gap-2.5">
                {list.lines.map((line) => (
                  <li key={line} className="flex items-start gap-3 text-sm leading-snug">
                    <span aria-hidden="true" className={cn("mt-px grid size-5 shrink-0 place-items-center rounded-full [&_svg]:size-3", list.tile)}>
                      {list.icon}
                    </span>
                    <span className="min-w-0 pt-px">{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : null}

      {shopHref ? (
        <div>
          <Button asChild variant="outline">
            <a href={shopHref}>
              {words.back}
              <IconArrowRight />
            </a>
          </Button>
        </div>
      ) : null}
    </div>
  );
}
