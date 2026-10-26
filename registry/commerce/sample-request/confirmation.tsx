import { IconArrowRight, IconCheck, IconTruck } from "@rhs-ui/icons";
import type { SampleAddress, SampleWords, Swatch } from "@rhs-ui/commerce/sample-request/samples";
import { SwatchFace } from "@rhs-ui/commerce/sample-request/swatch";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";

export interface SampleConfirmationProps {
  /** The id of the heading, so the section can be named by it. */
  titleId: string;
  /** The heading's element. */
  headingAs: "h2" | "h3";
  /** The samples that are coming. */
  swatches: readonly Swatch[];
  /** Where the samples are going. */
  address: SampleAddress;
  /** The delivery promise, as it was on the form. */
  deliveryNote?: string;
  /** The order reference, when the shop gave one. */
  reference?: string;
  /** Where "Back to the shop" goes. Without it there is no link. */
  shopHref?: string;
  /** Every word the confirmation says. */
  words: SampleWords;
}

/**
 * What replaces the form once the request is sent: the promise, what is coming (each sample with its swatch), where
 * it is going and the order reference. It keeps no state, so it renders on the server too.
 */
export function SampleConfirmation({ titleId, headingAs: Heading, swatches, address, deliveryNote, reference, shopHref, words }: SampleConfirmationProps) {
  const Sub = Heading === "h2" ? "h3" : "h4";
  return (
    <div data-slot="sample-request-sent" className="grid gap-8">
      <header className="flex items-start gap-4">
        <span aria-hidden="true" className="grid size-11 shrink-0 place-items-center rounded-full bg-foreground text-background">
          <IconCheck className="size-5" strokeWidth={2.25} />
        </span>
        <div className="min-w-0">
          <Heading id={titleId} tabIndex={-1} data-focus-target="" className="text-2xl leading-tight font-medium tracking-[-0.035em] text-balance outline-none @3xl:text-3xl">
            {words.sentTitle}
          </Heading>
          {deliveryNote ? (
            <p className="mt-2 flex items-center gap-2 text-base text-muted-foreground">
              <IconTruck aria-hidden="true" className="size-[1.125rem] shrink-0" />
              {deliveryNote}
            </p>
          ) : null}
        </div>
      </header>

      <div className="grid gap-8 @3xl:grid-cols-[minmax(0,1fr)_minmax(0,18rem)] @3xl:items-start">
        <div role="group" aria-labelledby={`${titleId}-list`} className="grid gap-3">
          <Sub id={`${titleId}-list`} className="text-sm font-medium">
            {words.sentList}
          </Sub>
          <ul role="list" className="grid grid-cols-[repeat(auto-fill,minmax(8.5rem,1fr))] gap-3">
            {swatches.map((swatch) => (
              <li key={swatch.id} className="grid content-start gap-2 rounded-xl border border-border bg-card p-2 shadow-xs">
                <SwatchFace swatch={swatch} className="aspect-[4/3] w-full rounded-lg" />
                <span className="px-0.5 pb-0.5 text-sm leading-snug font-medium text-pretty">{swatch.name}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="grid gap-6">
          {reference ? (
            <div role="group" aria-labelledby={`${titleId}-reference`} className="grid gap-2">
              <Sub id={`${titleId}-reference`} className="text-sm font-medium">
                {words.sentReference}
              </Sub>
              <Badge variant="outline" className="h-8 w-fit px-3 font-mono text-[0.8125rem] tracking-tight">
                {reference}
              </Badge>
            </div>
          ) : null}
          <div role="group" aria-labelledby={`${titleId}-address`} className="grid gap-2">
            <Sub id={`${titleId}-address`} className="text-sm font-medium">
              {words.sentAddress}
            </Sub>
            <address className="rounded-xl border border-border bg-card px-4 py-3.5 text-sm leading-relaxed not-italic shadow-xs">
              <span className="block font-medium">{address.name}</span>
              <span className="block text-muted-foreground">{address.line1}</span>
              <span className="block text-muted-foreground">
                {address.postalCode} {address.city}
              </span>
              <span className="mt-2 block text-muted-foreground [overflow-wrap:anywhere]">{address.email}</span>
            </address>
          </div>
        </div>
      </div>

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
