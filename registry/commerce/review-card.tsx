import { IconBadgeCheck, IconStar } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface ReviewCardProps {
  rating: 1 | 2 | 3 | 4 | 5;
  title?: string;
  body: string;
  author: string;
  /** "12 March 2026", formatted on your side. */
  date: string;
  dateTime: string;
  /** Bought the product: a badge says so. */
  verified?: boolean;
  /** What they bought: "Stone, size M". */
  variant?: string;
  /** Your reply, shown under the review. */
  reply?: string;
  className?: string;
}

/**
 * One customer review: stars with the rating in words, title and text,
 * who and when, a verified-purchase badge, the variant they chose, and the
 * shop's reply when there is one.
 */
export function ReviewCard({ rating, title, body, author, date, dateTime, verified = false, variant, reply, className }: ReviewCardProps) {
  return (
    <article data-slot="review-card" className={cn("rounded-xl border border-border p-5", className)}>
      <div className="flex items-center gap-0.5" role="img" aria-label={`${rating} out of 5 stars`}>
        {[1, 2, 3, 4, 5].map((star) => <IconStar key={star} className={cn("size-4", star <= rating ? "fill-current text-foreground" : "text-border")} />)}
      </div>
      {title ? <h3 className="mt-3 text-sm font-medium">{title}</h3> : null}
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{body}</p>
      <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">{author}</span>
        {verified ? <span className="inline-flex items-center gap-1 [&_svg]:size-3.5"><IconBadgeCheck />Verified purchase</span> : null}
        <time dateTime={dateTime}>{date}</time>
        {variant ? <span>{variant}</span> : null}
      </p>
      {reply ? (
        <div className="mt-4 rounded-lg bg-muted/60 p-3 text-sm">
          <p className="text-xs font-medium">Reply from the shop</p>
          <p className="mt-1 text-muted-foreground">{reply}</p>
        </div>
      ) : null}
    </article>
  );
}
