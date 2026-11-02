import type { ComponentProps, ReactNode } from "react";

import { dateIn, fill, type DateInput } from "@rhs-ui/application/membership-card/format";
import { IconBan, IconCheck, IconClock, IconMaximize } from "@rhs-ui/icons";
import { Avatar, AvatarFallback, AvatarImage, initialsOf } from "@rhs-ui/primitives/avatar";
import { Badge } from "@rhs-ui/primitives/badge";
import { CopyButton } from "@rhs-ui/primitives/copy-button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@rhs-ui/primitives/dialog";
import { cn } from "@/lib/utils";

/** Whether the membership still counts. An expired card states when it ended and hides the code. */
export type MembershipStatus = "active" | "expired";

/** Who the card belongs to. */
export interface MembershipMember {
  /** Their name: "Maya Okafor". */
  name: string;
  /** Their member number, as it is printed: "4821 0937". It is set in mono and can be copied. */
  number: string;
  /** Their picture, as an image address. Without one the avatar shows their initials. */
  image?: string;
}

/** The words the card uses, for translation. `{name}`, `{tier}` and `{date}` are filled in. */
export interface MembershipCardLabels {
  /** The card's accessible name. Default "{name}, {tier} membership". */
  name?: string;
  /** The small line at the top when you give no `organisation`. Default "Membership". */
  membership?: string;
  /** The badge of a card that counts. Default "Active". */
  active?: string;
  /** The badge of a lapsed card. Default "Expired". */
  expired?: string;
  /** What a lapsed card says in place of its end date. Default "Expired on {date}". */
  expiredOn?: string;
  /** The label of the member number. Default "Member no.". */
  memberNumber?: string;
  /** The name of the copy button. Default "Copy member number". */
  copyNumber?: string;
  /** What it says once the number is copied. Default "Member number copied". */
  numberCopied?: string;
  /** The label before the date the membership began. Default "Member since". */
  since?: string;
  /** The label of the end date. Default "Valid until". */
  validUntil?: string;
  /** The name of the button that opens the code large. Default "Show membership code full size". */
  showCode?: string;
  /** The hint under the code. Default "Tap to enlarge". */
  tapToEnlarge?: string;
  /** The title of the large code. Default "Membership code". */
  codeTitle?: string;
  /** The line under that title. Default "Hold this screen up to the reader.". */
  codeHint?: string;
  /** What stands where the code was on a lapsed card. Default "Code hidden". */
  codeHidden?: string;
}

export interface MembershipCardProps extends Omit<ComponentProps<"article">, "children"> {
  /** The person the card belongs to. */
  member: MembershipMember;
  /** The level of the membership: "Gold". It is set large. */
  tier: string;
  /** Who runs the membership: "Halcyon Fitness". Written small above the tier. */
  organisation?: string;
  /** When the membership began. Written as month and year. */
  since?: DateInput;
  /** When it ends. Written as a date; a lapsed card says "Expired on" with it. */
  validUntil?: DateInput;
  /** The code for the door or the till, as a node: the kit's QR code, an `<svg>`, an `<img>` or your own. It must fill its box (width and height 100%); a QR's modules should be dark, because the code always sits on a white tile. */
  qr?: ReactNode;
  /** Active, or expired: an expired card hides the code and says when it ended. Default "active". */
  status?: MembershipStatus;
  /** The language of the dates. Default "en-US". */
  locale?: string;
  /** The time zone the dates are written in, so the server and the browser agree. Default "UTC". */
  timeZone?: string;
  /** The words the card uses, for translation. */
  labels?: MembershipCardLabels;
}

const DEFAULT_LABELS = {
  name: "{name}, {tier} membership",
  membership: "Membership",
  active: "Active",
  expired: "Expired",
  expiredOn: "Expired on {date}",
  memberNumber: "Member no.",
  copyNumber: "Copy member number",
  numberCopied: "Member number copied",
  since: "Member since",
  validUntil: "Valid until",
  showCode: "Show membership code full size",
  tapToEnlarge: "Tap to enlarge",
  codeTitle: "Membership code",
  codeHint: "Hold this screen up to the reader.",
  codeHidden: "Code hidden",
};

/** A code always sits on a white tile with dark modules, in light and in dark, because a reader needs the contrast. The node inside fills the tile. */
const TILE = "rounded-xl bg-white text-black ring-1 ring-border [&_canvas]:size-full [&_img]:size-full [&_svg]:size-full";

/**
 * A digital membership card for a gym, a club or a library: the tier set
 * large, the member with their picture, their number as a mono value you can
 * copy, and the dates that matter. The code for the door or the till sits on a
 * white tile whatever the theme, and tapping it opens it large for scanning.
 * A card that has lapsed says "Expired on 3 Mar 2026", mutes the tier and hides
 * the code, so nobody holds up something that no longer opens the door. The
 * card is named by the member and the tier.
 */
export function MembershipCard({ member, tier, organisation, since, validUntil, qr, status = "active", locale = "en-US", timeZone = "UTC", labels, className, ...props }: MembershipCardProps) {
  const text = { ...DEFAULT_LABELS, ...labels };
  const expired = status === "expired";
  const sinceText = since === undefined ? null : dateIn(since, locale, timeZone, { month: "short", year: "numeric" });
  const untilText = validUntil === undefined ? null : dateIn(validUntil, locale, timeZone, { day: "numeric", month: "short", year: "numeric" });
  const hasCode = expired || Boolean(qr);

  return (
    <article
      data-slot="membership-card"
      data-status={status}
      aria-label={fill(text.name, { name: member.name, tier })}
      className={cn("@container w-full overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-sm", className)}
      {...props}
    >
      <div className="flex items-start justify-between gap-4 px-6 pt-6">
        <p className="min-w-0 text-xs font-medium tracking-[0.1em] text-muted-foreground uppercase [overflow-wrap:anywhere] line-clamp-2 @min-[20rem]:tracking-[0.14em]">{organisation ?? text.membership}</p>
        <Badge variant={expired ? "muted" : "outline"} className="shrink-0 gap-1 pr-2.5">
          {expired ? <IconClock /> : <IconCheck />}
          {expired ? text.expired : text.active}
        </Badge>
      </div>

      <div className={cn("grid grid-cols-1 gap-x-5 gap-y-6 px-6 pt-4 pb-6", hasCode && "@min-[20rem]:grid-cols-[minmax(0,1fr)_auto]")}>
        <p className={cn("col-start-1 row-start-1 min-w-0 self-end text-4xl leading-none font-semibold tracking-[-0.05em] [overflow-wrap:anywhere] @sm:self-start @sm:text-5xl", expired && "text-muted-foreground")}>{tier}</p>
        <div className={cn("row-start-2 flex min-w-0 items-center gap-3", hasCode && "@min-[20rem]:col-span-2 @sm:col-span-1 @sm:self-end")}>
          <Avatar size="lg" aria-hidden="true" className={cn("shrink-0", expired && "grayscale")}>
            {member.image ? <AvatarImage src={member.image} alt="" /> : null}
            <AvatarFallback>{initialsOf(member.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-base leading-tight font-medium tracking-[-0.01em]">{member.name}</p>
            {expired ? (
              <p className="mt-0.5 truncate text-[0.8125rem] leading-5 font-medium">{untilText ? fill(text.expiredOn, { date: untilText }) : text.expired}</p>
            ) : sinceText ? (
              <p className="mt-0.5 truncate text-[0.8125rem] leading-5 text-muted-foreground">
                {text.since} {sinceText}
              </p>
            ) : null}
          </div>
        </div>

        {expired ? (
          <div className="col-start-1 row-start-3 flex flex-col items-center gap-2 justify-self-center @min-[20rem]:col-start-2 @min-[20rem]:row-start-1 @min-[20rem]:self-end @min-[20rem]:justify-self-auto @sm:row-span-2">
            <div aria-hidden="true" className="grid size-28 place-items-center rounded-xl border border-dashed border-border text-muted-foreground">
              <IconBan className="size-6" />
            </div>
            <span className="text-[0.6875rem] leading-4 text-muted-foreground">{text.codeHidden}</span>
          </div>
        ) : qr ? (
          <div className="col-start-1 row-start-3 flex flex-col items-center gap-2 justify-self-center @min-[20rem]:col-start-2 @min-[20rem]:row-start-1 @min-[20rem]:self-end @min-[20rem]:justify-self-auto @sm:row-span-2">
            <Dialog>
              <DialogTrigger asChild>
                <button
                  type="button"
                  aria-label={text.showCode}
                  className={cn(TILE, "group/code relative block size-28 cursor-zoom-in p-2.5 shadow-xs transition-shadow duration-150 outline-none hover:shadow-sm focus-visible:ring-[3px] focus-visible:ring-ring/60 motion-reduce:transition-none")}
                >
                  {qr}
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                  <DialogTitle>{text.codeTitle}</DialogTitle>
                  <DialogDescription>{text.codeHint}</DialogDescription>
                </DialogHeader>
                <div className={cn(TILE, "mx-auto aspect-square w-full max-w-72 p-5 shadow-sm")}>{qr}</div>
                <div className="text-center">
                  <p className="text-base font-semibold tracking-[-0.01em]">{member.name}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground tabular-nums">
                    {tier} · {member.number}
                  </p>
                </div>
              </DialogContent>
            </Dialog>
            <span aria-hidden="true" className="inline-flex items-center gap-1 text-[0.6875rem] leading-4 text-muted-foreground">
              <IconMaximize className="size-3" />
              {text.tapToEnlarge}
            </span>
          </div>
        ) : null}
      </div>

      <dl className="grid gap-x-6 gap-y-4 border-t border-border bg-muted/40 px-6 py-4 @min-[18rem]:grid-cols-[auto_minmax(0,1fr)] @sm:grid-cols-[1.35fr_1fr]">
        <div className="min-w-0">
          <dt className="text-xs leading-4 text-muted-foreground">{text.memberNumber}</dt>
          <dd className="mt-1 flex items-center gap-1">
            <span className="min-w-0 truncate font-mono text-sm leading-8 font-medium tracking-[0.04em] tabular-nums">{member.number}</span>
            <CopyButton value={member.number} iconOnly size="sm" variant="ghost" label={text.copyNumber} copiedLabel={text.numberCopied} className="shrink-0 text-muted-foreground hover:text-foreground" />
          </dd>
        </div>
        {untilText ? (
          <div className="min-w-0">
            <dt className="text-xs leading-4 text-muted-foreground">{text.validUntil}</dt>
            <dd className={cn("mt-1 text-sm leading-8 font-medium tabular-nums", expired && "text-muted-foreground")}>{untilText}</dd>
          </div>
        ) : null}
      </dl>
    </article>
  );
}
