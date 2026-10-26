import { useId, type ComponentProps, type ReactNode } from "react";

import { IconMail, IconPhone, IconUsers } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface EnterpriseCapability {
  /** A small icon in front of the label: an IconShieldCheck, an IconFileSignature. It is decoration; the label says it all. */
  icon: ReactNode;
  /** What large buyers ask for, in words: "SSO and SCIM". */
  label: string;
  /** A line that makes it concrete: "Okta, Entra ID and Google Workspace". */
  description?: string;
}

export interface EnterpriseContact {
  /** Becomes a mailto link and is shown as written. */
  email?: string;
  /** Shown as written and becomes a tel link made of its digits and a leading plus. */
  phone?: string;
}

export interface EnterprisePlanBandLabels {
  /** The small line above the email and phone number. */
  contact: string;
}

export interface EnterprisePlanBandProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** The question or offer: "Need something bigger?". */
  title: string;
  /** One or two sentences on what changes for a large team. */
  description?: string;
  /** What large buyers ask for, usually three. They sit in columns on a wide band and in a list on a narrow one. */
  capabilities: readonly EnterpriseCapability[];
  /** The direct line to sales, shown under the button as real links. */
  contact?: EnterpriseContact;
  /** Who the plan suits: "Usually teams of 200 or more". */
  note?: string;
  /** The one action: a Button or a link styled as one, "Talk to sales". It fills the width of its panel. */
  action: ReactNode;
  /** The level of the title: 2 by default. */
  headingLevel?: 2 | 3 | 4;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<EnterprisePlanBandLabels>;
}

const LABELS: EnterprisePlanBandLabels = { contact: "Or reach sales directly" };

const LINK =
  "inline-flex min-w-0 items-center gap-2.5 rounded-sm font-medium text-foreground underline decoration-foreground/30 underline-offset-4 outline-none transition-colors duration-150 hover:decoration-current focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none";

/**
 * The "need more?" band under the plan cards: what large buyers ask for, who
 * the plan suits, and a direct line to sales. Plan cards sell the 90 percent;
 * this band keeps the other 10 percent from leaving. The capabilities are
 * plain text with an icon, the contact details are real links, and the band
 * collapses to one column on a narrow screen with the button coming first, so
 * the way to act is never below the fold of a list.
 */
export function EnterprisePlanBand({ title, description, capabilities, contact, note, action, headingLevel = 2, labels: custom, className, ...props }: EnterprisePlanBandProps) {
  const labels = { ...LABELS, ...custom };
  const id = useId();
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";
  const hasContact = Boolean(contact?.email || contact?.phone);
  return (
    <section data-slot="enterprise-plan-band" aria-labelledby={`${id}-title`} className={cn("@container w-full rounded-2xl border border-border bg-card break-words", className)} {...props}>
      <div className="grid gap-x-12 gap-y-8 p-6 @3xl:grid-cols-[minmax(0,1fr)_minmax(0,19rem)] @3xl:p-10">
        <div className="@3xl:col-start-1 @3xl:row-start-1">
          <Heading id={`${id}-title`} className="text-2xl leading-[1.15] font-medium tracking-[-0.03em] text-balance @3xl:text-3xl">
            {title}
          </Heading>
          {description ? <p className="mt-3 max-w-xl text-base leading-relaxed text-pretty text-muted-foreground">{description}</p> : null}
        </div>

        {/* The action comes before the capabilities in the page, so on a phone it is the first thing after the question. */}
        <div className="rounded-xl bg-muted/60 p-5 @3xl:col-start-2 @3xl:row-span-2 @3xl:row-start-1 @3xl:self-start @3xl:p-6">
          <div className="[&>*]:w-full">{action}</div>
          {hasContact ? (
            <div className="mt-5">
              <p className="text-xs text-muted-foreground">{labels.contact}</p>
              <ul role="list" className="mt-2.5 grid gap-2.5 text-sm">
                {contact?.email ? (
                  <li className="flex">
                    <a href={`mailto:${contact.email}`} className={LINK}>
                      <IconMail aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 break-all">{contact.email}</span>
                    </a>
                  </li>
                ) : null}
                {contact?.phone ? (
                  <li className="flex">
                    <a href={`tel:${contact.phone.replace(/[^\d+]/g, "")}`} className={LINK}>
                      <IconPhone aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
                      <span className="tabular-nums">{contact.phone}</span>
                    </a>
                  </li>
                ) : null}
              </ul>
            </div>
          ) : null}
          {note ? (
            <p className={cn("flex items-start gap-2.5 text-[0.8125rem] leading-snug text-muted-foreground", hasContact ? "mt-5 border-t border-border pt-4" : "mt-4")}>
              <IconUsers aria-hidden="true" className="mt-px size-4 shrink-0" />
              {note}
            </p>
          ) : null}
        </div>

        <ul role="list" className="grid gap-5 @xl:grid-cols-3 @3xl:col-start-1 @3xl:row-start-2 @3xl:grid-cols-1 @5xl:grid-cols-3">
          {capabilities.map((capability) => (
            <li key={capability.label} className="flex items-start gap-3.5 @xl:flex-col @xl:gap-3 @3xl:flex-row @3xl:gap-3.5 @5xl:flex-col @5xl:gap-3">
              <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-lg border border-border bg-background text-foreground [&_svg]:size-[1.125rem]">
                {capability.icon}
              </span>
              <div className="min-w-0">
                <p className="text-sm leading-snug font-medium">{capability.label}</p>
                {capability.description ? <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{capability.description}</p> : null}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
