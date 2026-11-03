import { Children, useId, type ComponentProps, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/** `plain` sits on the page with a hairline under its header, `bordered` is a card with ruled header and footer, `muted` a soft grey panel. */
export type SectionShellTone = "plain" | "bordered" | "muted";

export interface SectionShellProps extends Omit<ComponentProps<"section">, "title"> {
  /** The heading. It names the section for assistive technology, so every block of the page shows up in the landmark list. */
  title: ReactNode;
  /** A line under the title that says what the section is for. */
  description?: ReactNode;
  /** Buttons or links for the section, on the title's line. They wrap under it on a phone. */
  actions?: ReactNode;
  /** The heading level, `h2` to `h4`, so sections nest into the page's outline. Default `h2`. */
  level?: "h2" | "h3" | "h4";
  /** Makes the section a link target: it gets this id and a scroll margin, so a sticky header never covers its heading. Set `--section-scroll-offset` (default 5rem) to the height of your header. */
  id?: string;
  /** The surface: `plain`, `bordered` or `muted`. Default `plain`. */
  tone?: SectionShellTone;
  /** A row under the content, such as a hint on the left and a Save button on the right. */
  footer?: ReactNode;
  /** What to show in place of the content when there is none, so the section never shows a lonely heading. */
  empty?: ReactNode;
  /** The content of the section. */
  children?: ReactNode;
}

const SURFACE: Record<SectionShellTone, { root: string; header: string; ruled: string; body: string; footer: string }> = {
  plain: {
    root: "",
    header: "",
    ruled: "border-b border-border pb-4",
    body: "pt-5",
    footer: "pt-5",
  },
  bordered: {
    root: "rounded-xl border border-border bg-card text-card-foreground shadow-xs",
    header: "px-5 py-4 sm:px-6",
    ruled: "border-b border-border",
    body: "px-5 py-5 sm:px-6",
    footer: "rounded-b-[calc(var(--radius-xl,0.75rem)-1px)] border-t border-border bg-muted/40 px-5 py-3 sm:px-6",
  },
  muted: {
    root: "rounded-xl bg-muted/50",
    header: "px-5 pt-5 sm:px-6 sm:pt-6",
    ruled: "",
    body: "px-5 pb-5 pt-4 sm:px-6 sm:pb-6",
    footer: "border-t border-border px-5 py-4 sm:px-6",
  },
};

const TITLE: Record<NonNullable<SectionShellProps["level"]>, string> = {
  h2: "text-lg",
  h3: "text-base",
  h4: "text-sm",
};

/**
 * A titled page section: heading, description, actions and content in one
 * landmark, with the spacing and the anchor already right. The section is
 * labelled by its own heading, so it shows up in a screen reader's landmark
 * list. Title and actions share a line that wraps on a phone, and a section
 * with no content shows `empty` instead of a lonely heading. Stack several
 * and the space between them is the same everywhere (`--section-shell-gap`,
 * 2rem), with no margin at the call site.
 */
export function SectionShell({ title, description, actions, level = "h2", id, tone = "plain", footer, empty, className, children, ...props }: SectionShellProps) {
  const auto = useId();
  const headingId = `${id ?? auto}-heading`;
  const Heading = level;
  const surface = SURFACE[tone];
  const hasContent = Children.toArray(children).length > 0;
  const body = hasContent ? children : empty;
  // A header rules itself off only when something follows it, so a section that has nothing else is not a heading with a line under it.
  const ruled = Boolean(body || footer);
  return (
    <section
      data-slot="section-shell"
      data-tone={tone}
      id={id}
      aria-labelledby={headingId}
      className={cn("scroll-mt-[var(--section-scroll-offset,5rem)] [[data-slot=section-shell]+&]:mt-[var(--section-shell-gap,2rem)]", surface.root, className)}
      {...props}
    >
      <header data-slot="section-shell-header" className={cn("flex flex-wrap items-start justify-between gap-x-4 gap-y-3", surface.header, ruled && surface.ruled, tone === "muted" && !ruled && "pb-5 sm:pb-6")}>
        <div className="min-w-0 flex-1 basis-56">
          <Heading id={headingId} className={cn("font-semibold tracking-[-0.02em] text-balance text-foreground", TITLE[level])}>
            {title}
          </Heading>
          {description ? <p className="mt-1 max-w-prose text-sm text-pretty text-muted-foreground">{description}</p> : null}
        </div>
        {actions ? (
          <div data-slot="section-shell-actions" className="flex flex-wrap items-center gap-2">
            {actions}
          </div>
        ) : null}
      </header>
      {body ? (
        <div data-slot="section-shell-body" data-empty={hasContent ? undefined : ""} className={surface.body}>
          {body}
        </div>
      ) : null}
      {footer ? (
        <footer data-slot="section-shell-footer" className={cn("flex flex-wrap items-center justify-between gap-x-4 gap-y-3 text-sm text-muted-foreground", surface.footer)}>
          {footer}
        </footer>
      ) : null}
    </section>
  );
}
