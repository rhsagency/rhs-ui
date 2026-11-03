import { useId, type ComponentProps, type ReactNode } from "react";

import { IconAlertCircle } from "@rhs-ui/icons";
import { Card, CardContent, CardFooter } from "@rhs-ui/primitives/card";
import { Separator } from "@rhs-ui/primitives/separator";
import { cn } from "@/lib/utils";

/** The two words of the quiet note beside the title, for translation. */
export interface FormSectionLabels {
  /** Default "Required". */
  required?: string;
  /** Default "Optional". */
  optional?: string;
}

export interface FormSectionProps extends Omit<ComponentProps<"fieldset">, "title"> {
  /** What the group is called. It is the legend, so a screen reader names the group before the first field. */
  title: ReactNode;
  /** One line of help under the title. It describes the group to assistive technology. */
  description?: ReactNode;
  /** A quiet note beside the title: the whole group is `required` or `optional`. Nothing is shown without it. */
  requirement?: "required" | "optional";
  /** `stacked` puts the title above the fields. `split` puts the title and the help in a column on the left that stays in view while a long group scrolls, and the fields in a bordered card on the right. Both are one column below 48rem of its own width, so also at 320px. Default `stacked`. */
  layout?: "stacked" | "split";
  /** A problem with the group as a whole ("Add at least one admin"), shown above the fields and tied to the fieldset with `aria-describedby`. Errors of a single field belong to that field. */
  error?: ReactNode;
  /** A slot at the foot of the group for a section-level action, usually its own Save button. It sits inside the fieldset, so `disabled` switches it off with the fields. */
  footer?: ReactNode;
  /** A hairline and a fixed space above every section after the first, so sections placed one after the other read as one calm column. Default true. */
  divided?: boolean;
  /** The words the section says, for translation. */
  labels?: FormSectionLabels;
}

const DEFAULT_LABELS = { required: "Required", optional: "Optional" } satisfies Required<FormSectionLabels>;

/**
 * A group of related fields: a real fieldset with a legend, so assistive
 * technology names the group ("Billing contact, Required") before the first
 * field, plus a line of help, a quiet Required or Optional note and a place
 * for a section-level error and a Save button. `disabled` switches off every
 * control inside natively. Sections share fixed spacing: fields sit 20px
 * apart, and every section after the first starts below a hairline, so a
 * long settings page reads as one column. In the `split` layout the title
 * column is sticky on wide screens. The legend is floated, which makes it an
 * ordinary box instead of the browser's special one on the border, and that
 * is also what lets it sit beside the fields; the fieldset contains the
 * float, so nothing overlaps the next section.
 */
export function FormSection({ title, description, requirement, layout = "stacked", error, footer, divided = true, labels, disabled, className, children, ...props }: FormSectionProps) {
  const text: Required<FormSectionLabels> = { ...DEFAULT_LABELS, ...labels };
  const base = useId();
  const titleId = `${base}-title`;
  const noteId = `${base}-note`;
  const descriptionId = `${base}-description`;
  const errorId = `${base}-error`;
  const describedBy = [requirement ? noteId : null, description ? descriptionId : null, error ? errorId : null].filter(Boolean).join(" ") || undefined;
  const split = layout === "split";

  return (
    <fieldset
      data-slot="form-section"
      data-layout={layout}
      data-invalid={error ? "" : undefined}
      disabled={disabled}
      aria-labelledby={titleId}
      aria-describedby={describedBy}
      className={cn(
        "group/section @container m-0 flow-root min-w-0 border-0 p-0",
        divided && "[&:not(:first-child)]:mt-8 [&:not(:first-child)]:border-t [&:not(:first-child)]:border-border [&:not(:first-child)]:pt-8 sm:[&:not(:first-child)]:mt-10 sm:[&:not(:first-child)]:pt-10",
        className,
      )}
      {...props}
    >
      <legend className={cn("float-left mb-5 w-full p-0", split && "@3xl:sticky @3xl:top-6 @3xl:mb-0 @3xl:w-60")}>
        <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          {/* Only the title is dimmed when the section is switched off: the note and the help beside it explain why, so they keep their contrast. */}
          <span id={titleId} className="text-base font-semibold tracking-[-0.015em] text-foreground group-disabled/section:opacity-60">
            {title}
          </span>
          {requirement ? (
            <span id={noteId} className="text-xs font-normal text-muted-foreground">
              {requirement === "required" ? text.required : text.optional}
            </span>
          ) : null}
        </span>
        {description ? (
          <span id={descriptionId} className="mt-1.5 block text-sm leading-relaxed font-normal text-muted-foreground">
            {description}
          </span>
        ) : null}
      </legend>

      <div data-slot="form-section-body" className={cn("clear-both min-w-0", split && "@3xl:clear-none @3xl:ml-[17rem]")}>
        {error ? (
          <p id={errorId} role="alert" className="mb-4 flex items-start gap-2 text-sm leading-5 font-medium text-destructive">
            <IconAlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <span className="min-w-0 [overflow-wrap:anywhere]">{error}</span>
          </p>
        ) : null}

        {split ? (
          <Card className={cn("gap-0 py-0", error && "border-destructive/50")}>
            <CardContent className="grid gap-5 px-5 py-5 @lg:px-6 @lg:py-6">{children}</CardContent>
            {footer ? (
              <>
                <Separator />
                <CardFooter className="flex-wrap justify-end gap-3 rounded-b-[calc(var(--radius-xl)-1px)] bg-muted/30 px-5 py-3.5 @lg:px-6">{footer}</CardFooter>
              </>
            ) : null}
          </Card>
        ) : (
          <>
            <div data-slot="form-section-fields" className="grid gap-5">
              {children}
            </div>
            {footer ? (
              <>
                <Separator className="mt-6" />
                <div className="flex flex-wrap items-center justify-end gap-3 pt-4">{footer}</div>
              </>
            ) : null}
          </>
        )}
      </div>
    </fieldset>
  );
}
