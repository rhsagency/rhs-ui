import type { ComponentProps } from "react";

import { IconContactless } from "@rhs-ui/icons";
import { DEFAULT_GROUPS, brandInfo, detectBrand, digitsOf, expiryParts, lengthOf, type BrandInfo, type CardBrand } from "@rhs-ui/commerce/payment-card-preview/card";
import { cn } from "@/lib/utils";

export type { CardBrand } from "@rhs-ui/commerce/payment-card-preview/card";

export interface PaymentCardPreviewLabels {
  /** The small title over the name on the front. */
  holder?: string;
  /** The small title over the expiry on the front. */
  expires?: string;
  /** The small title under the security code on the back. */
  securityCode?: string;
  /** Shown in the name's place until there is a name. */
  namePlaceholder?: string;
  /** The description for a card whose network is known. `{brand}`. */
  card?: string;
  /** The description for a card whose network is not known yet. */
  payment?: string;
  /** Added when there is a name. `{name}`. */
  forName?: string;
  /** Added once the number is complete. `{last4}`. */
  ending?: string;
  /** Added while the number is not complete. */
  incomplete?: string;
  /** Added once the expiry is complete. `{expiry}`. */
  expiresOn?: string;
  /** The description of a card with nothing on it yet. */
  empty?: string;
}

const WORDS = {
  holder: "Card holder",
  expires: "Expires",
  securityCode: "Security code",
  namePlaceholder: "Full name",
  card: "{brand} card",
  payment: "Payment card",
  forName: " for {name}",
  ending: " ending {last4}",
  incomplete: ", number not complete yet",
  expiresOn: ", expires {expiry}",
  empty: "Payment card, not filled in yet",
} satisfies Required<PaymentCardPreviewLabels>;

export interface PaymentCardPreviewProps extends Omit<ComponentProps<"figure">, "children"> {
  /** The card number as typed: with spaces or without, complete or not. Only the digits count. Nothing is stored or sent. */
  number?: string;
  /** The name as it is to appear on the card. Set in capitals. */
  name?: string;
  /** The expiry as typed: "09/28", "0928" or "09 / 28". */
  expiry?: string;
  /** The card network, set as text and used to group the digits. A key such as "visa" or "amex" sets the grouping (4-4-4-4, or 4-6-5 for American Express); any other text is shown as it is. Without it the brand is found from the first digits. */
  brand?: CardBrand | (string & {});
  /** Show the back, with the security code area. Under reduced motion it cross-fades instead of turning. */
  flipped?: boolean;
  /** Hide every digit of the number but the last four, so the preview is safe to show to someone looking over a shoulder. The security code on the back is hidden too. */
  masked?: boolean;
  /** The security code as typed, for the back. */
  cvc?: string;
  /** The words, for another language. */
  labels?: PaymentCardPreviewLabels;
}

const FACE = "absolute inset-0 overflow-hidden rounded-[4.2cqw] bg-primary text-primary-foreground shadow-sm ring-1 ring-foreground/10";
const SMALL = "text-[length:clamp(0.5rem,2.3cqw,0.62rem)] font-medium tracking-[0.16em] uppercase opacity-60";
/** An unfilled place: the bullet is there, but quietly. */
const SOFT = "opacity-35";

const fill = (template: string, values: Record<string, string>): string => template.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);

function NumberLine({ digits, groups, masked }: { digits: string; groups: readonly number[]; masked: boolean }) {
  // While typing, the digits just typed stay readable; once the number is complete only the last four are.
  const hiddenBefore = masked ? Math.max(0, digits.length - 4) : 0;
  let offset = 0;
  return (
    <p className="flex gap-x-[0.55em] font-mono text-[length:clamp(0.85rem,5.6cqw,1.55rem)] leading-none font-medium tracking-[0.06em] whitespace-nowrap">
      {groups.map((size, group) => {
        const start = offset;
        offset += size;
        return (
          <span key={group} className="inline-flex">
            {Array.from({ length: size }, (_, place) => {
              const position = start + place;
              const digit = digits[position];
              if (digit === undefined) {
                return (
                  <span key={place} className={SOFT}>
                    •
                  </span>
                );
              }
              return <span key={place}>{position < hiddenBefore ? "•" : digit}</span>;
            })}
          </span>
        );
      })}
    </p>
  );
}

/** A chip drawn with borders: the contacts are lines, the middle is a rounded square. */
function Chip() {
  const line = "bg-primary-foreground/35";
  return (
    <span aria-hidden="true" className="relative block h-[9.5cqw] w-[13cqw] overflow-hidden rounded-[1.6cqw] border border-primary-foreground/35 bg-primary-foreground/15">
      <span className={cn("absolute inset-x-0 top-1/3 h-px", line)} />
      <span className={cn("absolute inset-x-0 top-2/3 h-px", line)} />
      <span className={cn("absolute inset-y-0 left-[30%] w-px", line)} />
      <span className={cn("absolute inset-y-0 right-[30%] w-px", line)} />
      <span className="absolute inset-[24%_34%] rounded-[1cqw] border border-primary-foreground/35" />
    </span>
  );
}

function Back({ info, cvc, masked, words }: { info: BrandInfo | undefined; cvc: string; masked: boolean; words: Required<PaymentCardPreviewLabels> }) {
  const length = info?.cvc ?? 3;
  return (
    <>
      <span aria-hidden="true" className="absolute inset-x-0 top-[13%] h-[17%] bg-primary-foreground/20" />
      <div className="absolute inset-x-[6.5%] top-[42%] grid gap-[1.4cqw]">
        <div className="flex h-[10cqw] overflow-hidden rounded-[1cqw]">
          <span aria-hidden="true" className="flex-1 bg-primary-foreground/80" />
          <span className="flex w-[19cqw] items-center justify-center gap-[0.35em] bg-primary-foreground font-mono text-[length:clamp(0.8rem,4.4cqw,1.15rem)] leading-none font-medium text-primary">
            {Array.from({ length }, (_, place) => {
              const digit = cvc[place];
              return (
                <span key={place} className={digit === undefined ? SOFT : undefined}>
                  {digit === undefined || masked ? "•" : digit}
                </span>
              );
            })}
          </span>
        </div>
        <p className={cn(SMALL, "justify-self-end pr-[1cqw]")}>{words.securityCode}</p>
      </div>
    </>
  );
}

/**
 * A payment card drawn as the form beside it is filled in: the number grouped as its network groups it (4-4-4-4, or
 * 4-6-5 for American Express) with soft bullets where digits are still to come, the name in capitals, the expiry as
 * MM/YY, and the network in words (no logos, a chip drawn in CSS). It is one figure with one accessible description,
 * such as "Visa card for Ada Lovelace ending 4242, expires 09/28", worded for what is filled in so far. `flipped`
 * turns it over to the back and its security code area, and under reduced motion it cross-fades instead. `masked`
 * hides all but the last four digits. It stores and sends nothing, keeps no state and renders on the server.
 */
export function PaymentCardPreview({ number, name, expiry, brand, flipped = false, masked = false, cvc, labels, className, ...props }: PaymentCardPreviewProps) {
  const words: Required<PaymentCardPreviewLabels> = { ...WORDS, ...labels };
  const found = brand ?? detectBrand(number);
  const info = brandInfo(found);
  const groups = info?.groups ?? DEFAULT_GROUPS;
  const total = lengthOf(groups);
  const digits = digitsOf(number).slice(0, total);
  const [month, year] = expiryParts(expiry);
  const complete = digits.length === total;
  const dated = month.length === 2 && year.length === 2;
  const code = digitsOf(cvc).slice(0, info?.cvc ?? 4);
  const holder = name?.trim() ?? "";

  const description =
    !digits && !holder && !month
      ? words.empty
      : (info ? fill(words.card, { brand: info.name }) : words.payment) +
        (holder ? fill(words.forName, { name: holder }) : "") +
        (complete ? fill(words.ending, { last4: digits.slice(-4) }) : digits ? words.incomplete : "") +
        (dated ? fill(words.expiresOn, { expiry: `${month}/${year}` }) : "");

  const slots = [month[0], month[1], "/", year[0], year[1]];
  const hints = ["M", "M", "/", "Y", "Y"];

  return (
    <figure
      data-slot="payment-card-preview"
      data-flipped={flipped || undefined}
      data-brand={typeof found === "string" ? found : undefined}
      role="img"
      aria-label={description}
      className={cn("@container relative aspect-[1.586] w-full max-w-sm [perspective:1200px]", className)}
      {...props}
    >
      <div className={cn("absolute inset-0 transition-transform duration-500 ease-out motion-safe:[transform-style:preserve-3d] motion-reduce:transition-none", flipped && "motion-safe:[transform:rotateY(180deg)]")}>
        <div className={cn(FACE, "flex flex-col justify-between p-[6.5%] motion-safe:[backface-visibility:hidden] motion-reduce:transition-opacity motion-reduce:duration-200", flipped && "motion-reduce:opacity-0")}>
          <div className="flex items-start justify-between gap-[4%]">
            <div className="flex items-center gap-[3.5cqw]">
              <Chip />
              <IconContactless className="size-[6cqw] opacity-70" />
            </div>
            <span className="text-[length:clamp(0.65rem,3.4cqw,0.95rem)] font-semibold tracking-[0.14em] text-right uppercase">{info?.name}</span>
          </div>

          <NumberLine digits={digits} groups={groups} masked={masked} />

          {/* One grid of two rows, so the labels share a baseline and so do the values, whatever fonts they are set in. */}
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-[4%] gap-y-[0.8cqw]">
            <span className={SMALL}>{words.holder}</span>
            <span className={SMALL}>{words.expires}</span>
            <span className={cn("truncate text-[length:clamp(0.7rem,3.7cqw,0.95rem)] font-medium tracking-[0.08em] uppercase", !holder && SOFT)}>{holder || words.namePlaceholder}</span>
            <span className="font-mono text-[length:clamp(0.75rem,3.9cqw,1rem)] tracking-[0.08em] whitespace-nowrap">
              {slots.map((slot, index) => (
                <span key={index} className={slot === undefined ? SOFT : undefined}>
                  {slot ?? hints[index]}
                </span>
              ))}
            </span>
          </div>
        </div>

        <div
          className={cn(
            FACE,
            "motion-safe:[backface-visibility:hidden] motion-safe:[transform:rotateY(180deg)] motion-reduce:transition-opacity motion-reduce:duration-200",
            flipped ? "motion-reduce:opacity-100" : "motion-reduce:opacity-0",
          )}
        >
          <Back info={info} cvc={code} masked={masked} words={words} />
        </div>
      </div>
    </figure>
  );
}
