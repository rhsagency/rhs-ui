"use client";

import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";
import { RadioGroup as RadioGroupPrimitive } from "radix-ui";

import { IconAlertCircle, IconArrowLeft, IconCheck, IconInfo, IconKey } from "@rhs-ui/icons";
import { Alert, AlertDescription, AlertTitle } from "@rhs-ui/primitives/alert";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { Spinner } from "@rhs-ui/primitives/spinner";
import { cn } from "@/lib/utils";

/** One way to verify that the account has set up. */
export interface VerificationMethod {
  /** A stable identity, handed to `onValueChange` and `onContinue`: "authenticator", "sms". */
  id: string;
  /** Its name: "Authenticator app". */
  label: string;
  /** What happens when it is used, in one line: "Code from your authenticator app", "Text to a number ending 34". */
  description: string;
  /** What the tile shows. Default a key. */
  icon?: ReactNode;
  /**
   * Why it cannot be used right now ("Too many texts sent. Try again in 12 minutes."). The method stays on the list, disabled, with this
   * text under its name at full contrast, so nobody wonders where it went.
   */
  unavailableReason?: string;
}

/** The words the card uses, for translation. */
export interface VerificationMethodPickerLabels {
  /** The heading. Default "Choose how to verify". */
  heading?: string;
  /** The line under it. Default "Pick one way to confirm it is you. You only need one.". */
  description?: string;
  /** The name of the list, for screen readers. Default "Verification methods". */
  group?: string;
  /** The mark on the method used last time. Default "Last used". */
  lastUsed?: string;
  /** The button. Default "Continue". */
  continue?: string;
  /** The button beside the heading. Default "Back". */
  back?: string;
  /** The heading of the notice when no method can be used. Default "No method is available right now". */
  noneTitle?: string;
  /** The line under it. Default "Each one is paused for the reason shown. Try again later, or ask for help.". */
  noneBody?: string;
  /** Above the button when `onContinue` threw. Default "We could not start that method. Try again, or choose another.". */
  failed?: string;
}

export interface VerificationMethodPickerProps extends Omit<ComponentProps<"div">, "children" | "title" | "defaultValue" | "onChange"> {
  /** The methods the account has set up, in the order to show them. Those that cannot be used right now stay, disabled, with their reason. */
  methods: readonly VerificationMethod[];
  /** The chosen method's id. Pass it with `onValueChange` to control the choice; leave it out and the card keeps it. */
  value?: string;
  /** The method chosen first when the card keeps the choice itself. Default the last used one, or the first that can be used. */
  defaultValue?: string;
  /** The choice changed. Choosing only selects: nothing is sent until Continue is pressed. */
  onValueChange?: (id: string) => void;
  /** The id of the method used last time. It is marked "Last used" and chosen first. */
  lastUsed?: string;
  /**
   * Starts the chosen method: sends the text, asks for the key. Return a promise and the button is busy until it settles. Return a message,
   * or throw, and it is shown above the button with the choice kept.
   */
  onContinue: (id: string) => string | void | Promise<string | void>;
  /** Back to the code entry or the password page. Leave it out for no Back button. */
  onBack?: () => void;
  /** Under the button: "Can't use any of these? Use a recovery code", a link to support. */
  help?: ReactNode;
  /** The heading's element: "h1" (the default) when the card is the page, "h2" inside a page that has its own h1. */
  titleAs?: "h1" | "h2" | "h3";
  /** The words the card uses, for translation. */
  labels?: VerificationMethodPickerLabels;
}

const DEFAULT_LABELS = {
  heading: "Choose how to verify",
  description: "Pick one way to confirm it is you. You only need one.",
  group: "Verification methods",
  lastUsed: "Last used",
  continue: "Continue",
  back: "Back",
  noneTitle: "No method is available right now",
  noneBody: "Each one is paused for the reason shown. Try again later, or ask for help.",
  failed: "We could not start that method. Try again, or choose another.",
} satisfies Required<VerificationMethodPickerLabels>;

/** The failure text, darkened toward the foreground so the red words reach 4.5:1 on their pale fill. */
const DANGER_TEXT = "text-[color:color-mix(in_oklch,var(--destructive),var(--foreground)_30%)]";

/**
 * The "try another way" step of two-step sign-in: the methods the account has
 * set up, each as a card with a tile, its name and one line on what will
 * happen, the one used last time chosen first and marked "Last used". It is a
 * real radio group, so the arrow keys move and choose, but choosing only
 * selects: nothing is sent until Continue is pressed, so a stray keypress can
 * never text anyone. A method that cannot be used right now (texts
 * rate-limited, a key that is not plugged in) stays on the list, disabled,
 * with the reason in plain words under its name rather than faded away with the
 * rest of the card.
 */
export function VerificationMethodPicker({
  methods,
  value,
  defaultValue,
  onValueChange,
  lastUsed,
  onContinue,
  onBack,
  help,
  titleAs: Title = "h1",
  labels,
  className,
  ...props
}: VerificationMethodPickerProps) {
  const text: Required<VerificationMethodPickerLabels> = { ...DEFAULT_LABELS, ...labels };
  const usable = methods.filter((method) => !method.unavailableReason);
  const first = (usable.find((method) => method.id === lastUsed) ?? usable[0])?.id ?? "";
  const [own, setOwn] = useState(defaultValue ?? first);
  // A choice that has since become unavailable (a rate limit began after the card opened) is no choice: nothing is chosen, and Continue waits.
  const wanted = value ?? own;
  const current = usable.some((method) => method.id === wanted) ? wanted : "";
  const continueButton = useRef<HTMLButtonElement>(null);
  const working = useRef(false);
  const wasBusy = useRef(false);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState("");

  // The button stays focusable while it works (it is aria-disabled, not disabled), but a failed start hands the focus back to it for another try.
  useEffect(() => {
    if (wasBusy.current && !busy) continueButton.current?.focus();
    wasBusy.current = busy;
  }, [busy]);

  function choose(id: string) {
    if (value === undefined) setOwn(id);
    setProblem("");
    onValueChange?.(id);
  }

  async function start() {
    if (working.current || !current) return;
    working.current = true;
    setBusy(true);
    setProblem("");
    try {
      const result = await onContinue(current);
      if (typeof result === "string" && result) setProblem(result);
    } catch {
      setProblem(text.failed);
    } finally {
      working.current = false;
      setBusy(false);
    }
  }

  return (
    <div data-slot="verification-method-picker" className={cn("@container mx-auto grid w-full max-w-md gap-6 rounded-xl border border-border bg-card p-6 text-card-foreground shadow-xs sm:p-8", className)} {...props}>
      <div className="grid gap-4">
        {onBack ? (
          <Button type="button" variant="ghost" size="sm" onClick={onBack} className="-mt-1 -ml-2.5 w-fit text-muted-foreground hover:text-foreground">
            <IconArrowLeft />
            {text.back}
          </Button>
        ) : null}
        <div className="grid gap-1.5">
          <Title className="text-xl leading-tight font-semibold tracking-[-0.03em] text-balance">{text.heading}</Title>
          <p className="text-sm leading-relaxed text-muted-foreground">{text.description}</p>
        </div>
      </div>

      {usable.length === 0 ? (
        <Alert tone="info" role="status">
          <IconInfo />
          <AlertTitle>{text.noneTitle}</AlertTitle>
          <AlertDescription>{text.noneBody}</AlertDescription>
        </Alert>
      ) : null}

      <RadioGroupPrimitive.Root aria-label={text.group} value={current} onValueChange={choose} className="grid gap-2.5">
        {methods.map((method) => {
          const unavailable = Boolean(method.unavailableReason);
          return (
            <RadioGroupPrimitive.Item
              key={method.id}
              value={method.id}
              disabled={unavailable}
              className={cn(
                "group/method relative flex w-full items-start gap-3.5 rounded-xl border border-border bg-card p-4 text-left outline-none",
                "transition-[border-color,background-color,box-shadow] duration-150 motion-reduce:transition-none hover:bg-muted/40 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40",
                "data-[state=checked]:border-foreground data-[state=checked]:bg-muted/40",
                "disabled:cursor-not-allowed disabled:hover:bg-card",
              )}
            >
              <span aria-hidden="true" className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-lg border border-border bg-background text-foreground group-disabled/method:text-muted-foreground group-disabled/method:opacity-60 [&_svg]:size-[18px]">
                {method.icon ?? <IconKey />}
              </span>
              <span className="grid min-w-0 flex-1 gap-0.5">
                <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-sm leading-snug font-medium group-disabled/method:text-muted-foreground">{method.label}</span>
                  {method.id === lastUsed ? (
                    <Badge variant="outline" className="h-[1.125rem] px-1.5 text-[0.6875rem]">
                      {text.lastUsed}
                    </Badge>
                  ) : null}
                </span>
                <span className="text-sm leading-snug text-muted-foreground group-disabled/method:opacity-80">{method.description}</span>
                {method.unavailableReason ? (
                  <span className="mt-1.5 flex items-start gap-1.5 text-[0.8125rem] leading-snug font-medium text-foreground">
                    <IconInfo aria-hidden="true" className="mt-px size-3.5 shrink-0" />
                    {method.unavailableReason}
                  </span>
                ) : null}
              </span>
              <span
                aria-hidden="true"
                className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border border-border text-background group-disabled/method:border-dashed group-disabled/method:opacity-60 group-data-[state=checked]/method:border-foreground group-data-[state=checked]/method:bg-foreground [&_svg]:size-3"
              >
                <RadioGroupPrimitive.Indicator>
                  <IconCheck />
                </RadioGroupPrimitive.Indicator>
              </span>
            </RadioGroupPrimitive.Item>
          );
        })}
      </RadioGroupPrimitive.Root>

      <div className="grid gap-3">
        <div role="alert" className="empty:hidden">
          {problem ? (
            <Alert tone="destructive" role="none" className={DANGER_TEXT}>
              <IconAlertCircle />
              <AlertTitle>{problem}</AlertTitle>
            </Alert>
          ) : null}
        </div>
        <Button
          ref={continueButton}
          type="button"
          size="lg"
          // aria-disabled, not disabled: with nothing chosen it is quiet but still reachable, and while it works it keeps the focus; a press that cannot do anything is ignored.
          aria-disabled={!current || undefined}
          aria-busy={busy || undefined}
          onClick={() => void start()}
          className="w-full aria-disabled:cursor-default aria-disabled:bg-muted aria-disabled:text-muted-foreground aria-disabled:hover:bg-muted aria-busy:cursor-progress"
        >
          {busy ? <Spinner size={16} label="" role="presentation" aria-hidden="true" /> : null}
          {text.continue}
        </Button>
      </div>

      {help ? <div className="border-t border-border pt-5 text-center text-sm text-muted-foreground">{help}</div> : null}
    </div>
  );
}
