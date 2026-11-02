import { useId, type ComponentProps } from "react";

import { IconArrowUpRight } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";
import { CopyEmail } from "@rhs-ui/marketing/cta-giant-link/copy-email";

export interface CtaGiantLinkLabels {
  /** The name of the email address in the details. */
  email: string;
  /** The name of the response promise in the details. */
  reply: string;
  /** The name of the next free slot in the details. */
  slot: string;
  /** The copy button. */
  copy: string;
  /** The copy button for a moment after copying. */
  copied: string;
  /** Said to a screen reader after copying. */
  copiedAnnouncement: string;
  /** Said when the browser refuses to copy. */
  copyFailed: string;
}

const LABELS: CtaGiantLinkLabels = {
  email: "Email",
  reply: "Replies",
  slot: "Next free slot",
  copy: "Copy",
  copied: "Copied",
  copiedAnnouncement: "Email address copied to the clipboard.",
  copyFailed: "Could not copy. Select the address and copy it by hand.",
};

export interface CtaGiantLinkProps extends Omit<ComponentProps<"section">, "children"> {
  /** The ask, as one line: "Let's work together". The whole line is the link, and the arrow travels with its last word. */
  label: string;
  /** Where the line goes: a contact page, a booking page or a mailto link. */
  href: string;
  /** Your email address, shown under the line as a mailto link with a copy button. */
  email?: string;
  /** How fast you answer, in a few words: "Within one working day". */
  note?: string;
  /** The next place in your calendar: "Monday 3 November". */
  availability?: string;
  /** The level of the heading that holds the link: 2 by default. */
  headingLevel?: 2 | 3 | 4;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<CtaGiantLinkLabels>;
}

/**
 * The ask as one enormous line of type that is itself the link, for studios and freelancers: between two hairlines,
 * as large as the width allows, with an arrow that travels up and to the right on hover and keyboard focus and a
 * ring around the whole line. The size follows the width of the section, never the screen, so it fits a narrow
 * column as well as a wide page, and it breaks only between words, with the arrow kept to the last one. Under the
 * hairlines sit the details a visitor wants next: your address (a mailto link with a button that says Copied in
 * words), how fast you reply and the next free slot. Hover changes the colour and moves the arrow, nothing else.
 */
export function CtaGiantLink({ label, href, email, note, availability, headingLevel = 2, labels: custom, className, ...props }: CtaGiantLinkProps) {
  const labels = { ...LABELS, ...custom };
  const id = useId();
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";
  // The arrow belongs to the last word, so a line never ends with an arrow on a row of its own.
  const words = label.trim().split(/\s+/);
  const last = words.pop() ?? "";
  const rest = words.join(" ");
  const details = [email ? "email" : null, note ? "note" : null, availability ? "slot" : null].filter(Boolean).length;

  return (
    <section data-slot="cta-giant-link" aria-labelledby={`${id}-title`} className={cn("@container w-full break-words", className)} {...props}>
      <div className="border-y border-border py-8 @2xl:py-12">
        <Heading id={`${id}-title`} className="text-[clamp(2.75rem,12cqi,9rem)] leading-[0.95] font-medium tracking-[-0.04em] text-balance">
          <a
            href={href}
            className="group/link block rounded-2xl py-1 text-foreground outline-none transition-colors duration-200 hover:text-muted-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none"
          >
            {rest ? `${rest} ` : null}
            <span className="whitespace-nowrap">
              {last}
              <IconArrowUpRight
                aria-hidden="true"
                size="0.66em"
                strokeWidth={2}
                className="ml-[0.1em] inline-block align-[0.1em] transition-transform duration-300 ease-out group-hover/link:translate-x-[0.08em] group-hover/link:-translate-y-[0.08em] group-focus-visible/link:translate-x-[0.08em] group-focus-visible/link:-translate-y-[0.08em] motion-reduce:transition-none"
              />
            </span>
          </a>
        </Heading>
      </div>

      {details ? (
        <dl className={cn("mt-8 grid gap-x-10 gap-y-7 @2xl:mt-10", details === 3 && "@2xl:grid-cols-[1.35fr_1fr_1fr]", details === 2 && "@2xl:grid-cols-2")}>
          {email ? (
            <div className="min-w-0">
              <dt className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">{labels.email}</dt>
              <dd className="mt-2 flex min-h-8 flex-wrap items-center gap-x-3 gap-y-2">
                <a
                  id={`${id}-email`}
                  href={`mailto:${email}`}
                  className="rounded-sm text-lg leading-snug font-medium tracking-[-0.01em] break-all underline decoration-foreground/30 underline-offset-4 outline-none transition-colors duration-150 hover:decoration-current focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none"
                >
                  {email}
                </a>
                <CopyEmail value={email} describedBy={`${id}-email`} labels={{ copy: labels.copy, copied: labels.copied, announcement: labels.copiedAnnouncement, failed: labels.copyFailed }} />
              </dd>
            </div>
          ) : null}
          {note ? (
            <div className="min-w-0">
              <dt className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">{labels.reply}</dt>
              <dd className="mt-2 flex min-h-8 items-center text-lg leading-snug tracking-[-0.01em] text-pretty">{note}</dd>
            </div>
          ) : null}
          {availability ? (
            <div className="min-w-0">
              <dt className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">{labels.slot}</dt>
              <dd className="mt-2 flex min-h-8 items-center text-lg leading-snug tracking-[-0.01em] text-pretty">{availability}</dd>
            </div>
          ) : null}
        </dl>
      ) : null}
    </section>
  );
}
