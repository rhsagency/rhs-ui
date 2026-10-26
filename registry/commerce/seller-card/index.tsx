import { useId, type ComponentProps } from "react";

import { IconBadgeCheck, IconMessage, IconSparkle, IconStar, IconStore } from "@rhs-ui/icons";
import { RatingInline } from "@rhs-ui/commerce/rating-inline";
import { compactCount, fullCount, joinedOn, oneDecimal, replyTime } from "@rhs-ui/commerce/seller-card/seller";
import { Avatar, AvatarFallback, AvatarImage, initialsOf } from "@rhs-ui/primitives/avatar";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

/** Who sells it. Every field but the name is optional: what is missing is left out, never shown as a zero. */
export interface Seller {
  /** The seller's name as shoppers know it: "Kestrel Outdoor". */
  name: string;
  /** The logo: a URL or a data URI. Without one, or until it loads, the seller's initials are drawn. */
  logo?: string;
  /** Whether you have checked the seller. It is said in words, with an icon. */
  verified?: boolean;
  /** The average rating from 0 to 5. It is only shown together with a review count above zero. */
  rating?: number;
  /** How many reviews the rating rests on. */
  reviews?: number;
  /** How many items the seller has sold. Zero or missing counts as no history. */
  itemsSold?: number;
  /** How long the seller usually takes to answer, in minutes. It is rounded up to the nearest promise: "2 hours". */
  replyMinutes?: number;
  /** When the seller joined, as an ISO date: "2021-03-14". Written as a month and a year. */
  memberSince?: string;
}

export interface SellerCardLabels {
  /** The small line above the name. */
  soldBy?: string;
  /** The marker on a verified seller. */
  verified?: string;
  /** Instead of the rating, for a seller with no sales and no reviews. */
  newSeller?: string;
  /** Instead of the rating, for a seller with sales but no reviews. */
  noReviews?: string;
  /** The score as a sentence for a screen reader. `{rating}` and `{max}`. */
  rated?: string;
  /** After the score. `{count}`. */
  reviewsOne?: string;
  /** After the score, for any other number of reviews. `{count}`. */
  reviewsOther?: string;
  /** After the number of items sold, in the compact card. `{count}`. */
  soldCount?: string;
  /** The caption of the number of items sold. */
  itemsSold?: string;
  /** The caption of the reply time. */
  replyTime?: string;
  /** What the reply time says. `{time}` is a length of time: "Within 2 hours". */
  within?: string;
  /** When the seller is slower than the longest promise. `{time}`. */
  longerThan?: string;
  /** The caption of the date the seller joined. */
  memberSince?: string;
  /** The Contact button. */
  contact?: string;
  /** The Visit store link. */
  visitStore?: string;
  /** The name of the Contact action for a screen reader. `{name}` is the seller. */
  contactName?: string;
  /** The name of the Visit store link for a screen reader. `{name}`. */
  visitStoreName?: string;
}

const WORDS = {
  soldBy: "Sold by",
  verified: "Verified seller",
  newSeller: "New seller",
  noReviews: "No reviews yet",
  rated: "Rated {rating} out of {max}",
  reviewsOne: "{count} review",
  reviewsOther: "{count} reviews",
  soldCount: "{count} sold",
  itemsSold: "Items sold",
  replyTime: "Reply time",
  within: "Within {time}",
  longerThan: "More than {time}",
  memberSince: "Member since",
  contact: "Contact",
  visitStore: "Visit store",
  contactName: "Contact {name}",
  visitStoreName: "Visit store of {name}",
} satisfies Required<SellerCardLabels>;

export interface SellerCardProps extends Omit<ComponentProps<"div">, "children"> {
  /** The seller: name, logo, verification, rating, items sold, reply time and the date they joined. */
  seller: Seller;
  /** Called when Contact is pressed. Pass it from a client component, or use `contactHref`. */
  onContact?: () => void;
  /** Where Contact goes when that is a page or a message form: the button is then a link. */
  contactHref?: string;
  /** The seller's store. Visit store is a link to it; without it the action is left out. */
  storeHref?: string;
  /** A smaller card that sits beside the price: one line for the seller and one for the rating, with the two actions under it, and no row of figures. */
  compact?: boolean;
  /** Always pass your application locale, so the numbers and the date are written the same on the server and in the browser. */
  locale?: string;
  /** The time zone a date-time in `memberSince` is written in. A bare date such as "2021-03-14" is a calendar day and ignores it. */
  timeZone?: string;
  /** The words, for another language. */
  labels?: SellerCardLabels;
}

const fill = (template: string, values: Record<string, string>): string => template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

/**
 * The marketplace block on a product page: who sells this, and whether to trust them. The seller's logo or initials,
 * the name, a verified marker written out in words, the rating with the number of reviews, items sold, how fast they
 * answer and when they joined. Contact and Visit store are two separate actions. The rating is one sentence for a
 * screen reader, the same one the inline rating says ("Rated 4.8 out of 5, 1,284 reviews"). A seller without
 * history says "New seller" instead of showing 0 sales and 0 reviews, and a figure that is not known is left out.
 * The figures sit in a row when the card is wide and in a list when it is narrow, whatever the screen. The compact
 * card fits beside the price.
 */
export function SellerCard({ seller, onContact, contactHref, storeHref, compact = false, locale = "en-US", timeZone = "UTC", labels, className, ...props }: SellerCardProps) {
  const words = { ...WORDS, ...labels };
  const id = useId();
  const reviews = seller.reviews ?? 0;
  const rated = seller.rating !== undefined && Number.isFinite(seller.rating) && reviews > 0;
  const sold = (seller.itemsSold ?? 0) > 0 ? (seller.itemsSold ?? 0) : undefined;
  const score = rated ? Math.min(5, Math.max(0, seller.rating ?? 0)) : 0;
  const shown = oneDecimal(score, locale);
  const countWords = new Intl.PluralRules(locale).select(reviews) === "one" ? words.reviewsOne : words.reviewsOther;
  const sentence = rated ? `${fill(words.rated, { rating: shown, max: "5" })}, ${fill(countWords, { count: fullCount(reviews, locale) })}` : undefined;
  const reply = seller.replyMinutes === undefined ? undefined : replyTime(seller.replyMinutes, locale);
  const joined = seller.memberSince === undefined ? undefined : joinedOn(seller.memberSince, locale, timeZone);

  const logo = (
    <Avatar size={compact ? "default" : "lg"} aria-hidden="true" className={compact ? "data-[size=default]:size-10 rounded-lg" : "rounded-xl"}>
      {seller.logo ? <AvatarImage src={seller.logo} alt="" /> : null}
      <AvatarFallback className={compact ? "rounded-lg" : "rounded-xl"}>{initialsOf(seller.name)}</AvatarFallback>
    </Avatar>
  );

  // What stands in for the rating: the same footprint whatever the seller has, and never a zero.
  const standIn = rated ? null : sold !== undefined ? (
    <span className="text-xs text-muted-foreground">{words.noReviews}</span>
  ) : (
    <Badge variant="outline" className="gap-1">
      <IconSparkle />
      {words.newSeller}
    </Badge>
  );

  const size = compact ? "sm" : "default";
  const contactName = fill(words.contactName, { name: seller.name });
  const contact =
    contactHref || onContact ? (
      contactHref ? (
        <Button asChild variant="outline" size={size} className="flex-1">
          <a href={contactHref} aria-label={contactName} onClick={onContact}>
            <IconMessage />
            {words.contact}
          </a>
        </Button>
      ) : (
        <Button type="button" variant="outline" size={size} aria-label={contactName} onClick={onContact} className="flex-1">
          <IconMessage />
          {words.contact}
        </Button>
      )
    ) : null;
  const store = storeHref ? (
    <Button asChild variant="outline" size={size} className="flex-1">
      <a href={storeHref} aria-label={fill(words.visitStoreName, { name: seller.name })}>
        <IconStore />
        {words.visitStore}
      </a>
    </Button>
  ) : null;
  const actions = contact || store ? <div className={cn("flex flex-wrap gap-2", compact ? "mt-3" : "border-t border-border p-4")}>{contact}{store}</div> : null;

  const surface = cn("flex flex-col rounded-xl border border-border bg-card text-card-foreground shadow-xs", className);

  if (compact) {
    return (
      <div data-slot="seller-card" data-compact="" role="group" aria-labelledby={`${id}-name`} className={cn(surface, "p-3.5")} {...props}>
        <div className="flex items-center gap-3">
          {logo}
          <div className="min-w-0 flex-1">
            <h3 id={`${id}-name`} title={seller.name} className="line-clamp-2 text-sm leading-tight font-semibold tracking-[-0.01em] [overflow-wrap:anywhere]">
              <span className="sr-only">{words.soldBy} </span>
              {seller.name}
            </h3>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
              {seller.verified ? (
                <span className="inline-flex items-center gap-1 font-medium text-foreground">
                  <IconBadgeCheck aria-hidden="true" className="size-3.5" />
                  {words.verified}
                </span>
              ) : null}
              {rated ? (
                <span role="img" aria-label={sentence} className="inline-flex items-center gap-1 tabular-nums">
                  <IconStar aria-hidden="true" size={12} fill="currentColor" className="text-foreground" />
                  <span aria-hidden="true" className="font-medium text-foreground">
                    {shown}
                  </span>
                  <span aria-hidden="true">({compactCount(reviews, locale)})</span>
                </span>
              ) : (
                standIn
              )}
              {sold !== undefined ? <span className="tabular-nums">{fill(words.soldCount, { count: compactCount(sold, locale) })}</span> : null}
            </p>
          </div>
        </div>
        {actions}
      </div>
    );
  }

  const stats = [
    sold !== undefined ? { key: "sold", label: words.itemsSold, value: compactCount(sold, locale), spoken: fullCount(sold, locale) } : null,
    reply ? { key: "reply", label: words.replyTime, value: fill(reply.over ? words.longerThan : words.within, { time: reply.text }), spoken: undefined } : null,
    joined ? { key: "joined", label: words.memberSince, value: joined, spoken: undefined } : null,
  ].filter((stat) => stat !== null);

  return (
    <div data-slot="seller-card" role="group" aria-labelledby={`${id}-name`} className={cn("@container", surface)} {...props}>
      <div className="flex items-start gap-3.5 p-5">
        {logo}
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground">{words.soldBy}</p>
          <h3 id={`${id}-name`} className="mt-0.5 text-[1.0625rem] leading-tight font-semibold tracking-[-0.02em] [overflow-wrap:anywhere]">
            {seller.name}
          </h3>
          <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
            {seller.verified ? (
              <Badge variant="secondary" className="gap-1">
                <IconBadgeCheck />
                {words.verified}
              </Badge>
            ) : null}
            {rated ? <RatingInline value={score} count={reviews} label={sentence} locale={locale} /> : standIn}
          </div>
        </div>
      </div>

      {stats.length ? (
        <dl className="grid divide-y divide-border border-t border-border @min-[26rem]:auto-cols-fr @min-[26rem]:grid-flow-col @min-[26rem]:divide-x @min-[26rem]:divide-y-0">
          {stats.map((stat) => (
            <div key={stat.key} className="flex items-baseline justify-between gap-4 px-5 py-2.5 @min-[26rem]:flex-col-reverse @min-[26rem]:items-stretch @min-[26rem]:justify-end @min-[26rem]:gap-0.5 @min-[26rem]:px-4 @min-[26rem]:py-3">
              <dt className="text-xs text-muted-foreground">{stat.label}</dt>
              <dd className="text-right text-[0.9375rem] leading-snug font-semibold tracking-[-0.01em] tabular-nums @min-[26rem]:text-left @min-[26rem]:text-balance">
                {stat.spoken ? (
                  <>
                    <span aria-hidden="true">{stat.value}</span>
                    <span className="sr-only">{stat.spoken}</span>
                  </>
                ) : (
                  stat.value
                )}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}

      {actions}
    </div>
  );
}
