import { IconArrowRight, IconCheck } from "@rhs-ui/icons";
import type { BusinessTypeOption, SpendBand } from "@rhs-ui/commerce/trade-account-application/options";
import type { TradeApplicationValues } from "@rhs-ui/commerce/trade-account-application/validate";
import { fill, type TradeApplicationWords } from "@rhs-ui/commerce/trade-account-application/words";
import { Button } from "@rhs-ui/primitives/button";
import { DescriptionList, type DescriptionItem } from "@rhs-ui/primitives/description-list";

/** Each term sits over its value until the card is wide enough to put them side by side. The list's own breakpoint follows the screen; this one follows the card, so it also works in a narrow column on a wide screen. */
const FACTS = "[&>div]:grid-cols-1 [&>div]:gap-1 @sm:[&>div]:grid-cols-[minmax(8rem,1fr)_2fr] @sm:[&>div]:gap-4";

export interface TradeApplicationConfirmationProps {
  /** The id of the heading, so the section can be named by it. */
  titleId: string;
  /** The heading's element. */
  headingAs: "h2" | "h3";
  values: TradeApplicationValues;
  words: TradeApplicationWords;
  businessTypes: readonly BusinessTypeOption[];
  spendBands: readonly SpendBand[];
  reviewDays: number;
  shopHref?: string;
  locale: string;
}

/**
 * What replaces the form once it is sent: the promise of an answer, what the customer gave, what happens next and a
 * way back to the shop. It keeps no state, so it renders on the server too.
 */
export function TradeApplicationConfirmation({ titleId, headingAs: Heading, values, words, businessTypes, spendBands, reviewDays, shopHref, locale }: TradeApplicationConfirmationProps) {
  const plural = new Intl.PluralRules(locale);
  const days = new Intl.NumberFormat(locale).format(reviewDays);
  let country = values.country;
  try {
    country = new Intl.DisplayNames([locale], { type: "region" }).of(values.country) ?? values.country;
  } catch {
    // An unknown code is shown as it was given.
  }
  const type = businessTypes.find((entry) => entry.value === values.businessType)?.title ?? values.businessType;
  const spend = spendBands.find((entry) => entry.value === values.monthlySpend)?.label ?? values.monthlySpend;

  const details: DescriptionItem[] = [
    { term: words.fields.companyName, value: values.companyName },
    { term: words.fields.registrationNumber, value: <span className="tabular-nums">{values.registrationNumber}</span> },
    { term: words.fields.vatNumber, value: <span className="tabular-nums">{values.vatNumber}</span> },
    { term: words.fields.country, value: country },
    {
      term: words.sentContact,
      value: (
        <span className="grid gap-0.5">
          <span>{values.contactName}</span>
          {values.jobTitle ? <span className="font-normal text-muted-foreground">{values.jobTitle}</span> : null}
          <span className="font-normal text-muted-foreground [overflow-wrap:anywhere]">{values.email}</span>
          {values.phone ? <span className="font-normal text-muted-foreground tabular-nums">{values.phone}</span> : null}
        </span>
      ),
    },
    { term: words.fields.businessType, value: type },
    { term: words.fields.monthlySpend, value: spend },
    { term: words.fields.reference, value: values.reference ? <span className="[overflow-wrap:anywhere]">{values.reference.name}</span> : <span className="font-normal text-muted-foreground">{words.none}</span> },
  ];

  return (
    <div data-slot="trade-account-application-sent" className="grid gap-9">
      <header className="flex items-start gap-4">
        <span aria-hidden="true" className="grid size-11 shrink-0 place-items-center rounded-full bg-foreground text-background">
          <IconCheck className="size-5" strokeWidth={2.25} />
        </span>
        <div className="min-w-0">
          <Heading id={titleId} tabIndex={-1} data-focus-target="" className="text-2xl leading-tight font-medium tracking-[-0.035em] text-balance outline-none @3xl:text-3xl">
            {words.sentTitle}
          </Heading>
          <p className="mt-2 text-base text-muted-foreground">{fill(plural.select(reviewDays) === "one" ? words.sentPromiseOne : words.sentPromiseOther, { days })}</p>
        </div>
      </header>

      <section aria-labelledby={`${titleId}-details`} className="grid gap-3">
        <h3 id={`${titleId}-details`} className="text-sm font-medium">
          {words.sentDetails}
        </h3>
        <div className="rounded-xl border border-border bg-card px-5 py-4 shadow-xs">
          <DescriptionList items={details} className={FACTS} />
        </div>
      </section>

      <section aria-labelledby={`${titleId}-next`} className="grid gap-3">
        <h3 id={`${titleId}-next`} className="text-sm font-medium">
          {words.sentNext}
        </h3>
        <ol role="list" className="grid gap-3">
          {words.steps.map((step, index) => (
            <li key={step} className="flex items-start gap-3 text-sm leading-relaxed">
              <span aria-hidden="true" className="mt-px grid size-6 shrink-0 place-items-center rounded-full border border-border bg-muted text-xs font-medium tabular-nums">
                {index + 1}
              </span>
              <span className="pt-0.5">{fill(step, { email: values.email })}</span>
            </li>
          ))}
        </ol>
      </section>

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
