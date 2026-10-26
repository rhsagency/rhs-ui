"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type FormEvent, type ReactNode } from "react";

import { IconAlertCircle, IconArrowRight, IconBuilding, IconCheck, IconInfo, IconKey, IconSpinner } from "@rhs-ui/icons";
import { Alert, AlertDescription, AlertTitle } from "@rhs-ui/primitives/alert";
import { Avatar, AvatarFallback, AvatarImage, initialsOf } from "@rhs-ui/primitives/avatar";
import { Button } from "@rhs-ui/primitives/button";
import { FormControl, FormField, FormLabel } from "@rhs-ui/primitives/form-field";
import { Input } from "@rhs-ui/primitives/input";
import { RadioCards } from "@rhs-ui/primitives/radio-cards";
import { Spinner } from "@rhs-ui/primitives/spinner";
import { cn } from "@/lib/utils";

/** One way a company signs in: Okta, Microsoft Entra ID, Google Workspace. */
export interface SsoProvider {
  /** A stable identity, handed back to `onContinue`. */
  id: string;
  /** What it is called: "Okta". */
  name: string;
  /** One line about it: "Employees and contractors". */
  description?: string;
  /** What its tile shows, when it is one of several. Default a key; give each provider its own glyph so the tiles can be told apart at a glance. */
  icon?: ReactNode;
}

/** The company a domain belongs to. */
export interface SsoOrganisation {
  /** Its name: "Acme". The button reads "Continue with Acme SSO". */
  name: string;
  /** Its logo, as an image address. Without one the tile shows the initials. */
  logo?: string;
}

/** What `resolveDomain` resolves to when single sign-on is set up. */
export interface SsoResolution {
  /** The company, as a name or with a logo. */
  organisation: string | SsoOrganisation;
  /** Its identity providers. One continues with one button; several are offered as tiles and none is preselected. */
  providers: readonly SsoProvider[];
}

/** The words the card uses, for translation. `{domain}`, `{organisation}`, `{provider}` and `{name}` are filled in. */
export interface SsoSignInLabels {
  /** The heading. Default "Welcome back". */
  heading?: string;
  /** The line under it. Default "Enter your work email and we will find how your company signs in.". */
  description?: string;
  /** The email field's label. Default "Work email". */
  email?: string;
  /** Under the field when it is not an address. Default "Enter your work email, like name@company.com.". */
  invalid?: string;
  /** The button before a company is known. Default "Continue". */
  continue?: string;
  /** The button once a provider is known; `{name}` is "Acme SSO" for one provider or the provider's own name. Default "Continue with {name}". */
  continueWith?: string;
  /** How a company's single sign-on is named on the button; `{organisation}` is filled in. Default "{organisation} SSO". */
  ssoName?: string;
  /** Under the company's name. Default "Single sign-on is on for {domain}". */
  orgLine?: string;
  /** The heading of the provider tiles. Default "Choose how you sign in". */
  chooseProvider?: string;
  /** The name of the group of tiles, for screen readers. Default "Identity provider". */
  providerGroup?: string;
  /** Under the tiles when Continue was pressed with none chosen. Default "Choose one to continue.". */
  chooseOne?: string;
  /** The button of the "not set up" notice. Default "Sign in with a password". */
  passwordPrimary?: string;
  /** The quiet button under the main one. Default "Use a password instead". */
  passwordQuiet?: string;
  /** The heading of the notice when nothing is set up. Default "No single sign-on is set up for {domain}". */
  noneTitle?: string;
  /** The line under it. Default "Sign in with your password instead, or ask an admin to turn single sign-on on.". */
  noneBody?: string;
  /** The help link in that notice. Default "How single sign-on works". */
  help?: string;
  /** The heading of the notice when the lookup failed. Default "We could not check that domain". */
  failedTitle?: string;
  /** The line under it. Default "Check your connection and press Continue to try again.". */
  failedBody?: string;
  /** Above the button when `onContinue` threw. Default "We could not start single sign-on. Try again.". */
  continueFailed?: string;
  /** Said when a lookup starts. Default "Looking up single sign-on for {domain}.". */
  lookingSaid?: string;
  /** Said when one provider was found. Default "Single sign-on found for {organisation}.". */
  foundSaid?: string;
  /** Said when several were found. Default "Single sign-on found for {organisation}. Choose how you sign in.". */
  foundManySaid?: string;
  /** Said when nothing is set up. Default "No single sign-on is set up for {domain}.". */
  noneSaid?: string;
  /** Said when the lookup failed. Default "We could not check {domain}.". */
  failedSaid?: string;
}

export interface SsoSignInProps extends Omit<ComponentProps<"div">, "children" | "title" | "onSubmit"> {
  /**
   * Finds out whether a company's domain signs in with single sign-on. Resolve to its organisation and providers, or to null when none is set up;
   * reject when the lookup itself failed, and the card shows a retry message. It runs once the domain is typed and the typing has paused, never
   * for the same domain twice, and a slow answer never blocks the field. The second argument carries a signal that aborts when the person types on.
   */
  resolveDomain: (domain: string, options: { signal: AbortSignal }) => Promise<SsoResolution | null>;
  /** The button was pressed with a provider known: send the person to it. Return a promise and the button is busy until it settles; a rejection shows a message. */
  onContinue: (choice: { domain: string; providerId: string }) => void | Promise<void>;
  /** The person would rather type a password. It is the main button when no single sign-on is set up, and a quiet one otherwise. Leave it out for neither. */
  onUsePassword?: () => void;
  /** Where "How single sign-on works" leads, in the notice that nothing is set up. Leave it out for no link. */
  helpHref?: string;
  /** The address the field starts with. A domain in it is looked up as soon as the card appears. */
  defaultEmail?: string;
  /** Milliseconds of quiet after the last keystroke before the lookup starts. Default 450. */
  debounceMs?: number;
  /** Under the card's actions: terms, a link to create an account. */
  footer?: ReactNode;
  /** The heading's element: "h1" (the default) when the card is the page, "h2" inside a page that has its own h1. */
  titleAs?: "h1" | "h2" | "h3";
  /** The words the card uses, for translation. */
  labels?: SsoSignInLabels;
}

const DEFAULT_LABELS = {
  heading: "Welcome back",
  description: "Enter your work email and we will find how your company signs in.",
  email: "Work email",
  invalid: "Enter your work email, like name@company.com.",
  continue: "Continue",
  continueWith: "Continue with {name}",
  ssoName: "{organisation} SSO",
  orgLine: "Single sign-on is on for {domain}",
  chooseProvider: "Choose how you sign in",
  providerGroup: "Identity provider",
  chooseOne: "Choose one to continue.",
  passwordPrimary: "Sign in with a password",
  passwordQuiet: "Use a password instead",
  noneTitle: "No single sign-on is set up for {domain}",
  noneBody: "Sign in with your password instead, or ask an admin to turn single sign-on on.",
  help: "How single sign-on works",
  failedTitle: "We could not check that domain",
  failedBody: "Check your connection and press Continue to try again.",
  continueFailed: "We could not start single sign-on. Try again.",
  lookingSaid: "Looking up single sign-on for {domain}.",
  foundSaid: "Single sign-on found for {organisation}.",
  foundManySaid: "Single sign-on found for {organisation}. Choose how you sign in.",
  noneSaid: "No single sign-on is set up for {domain}.",
  failedSaid: "We could not check {domain}.",
} satisfies Required<SsoSignInLabels>;

const fill = (template: string, values: Record<string, string>) => template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
/** What the domain looks like once a top-level domain of two letters or more is typed: "acme.io", never "acme.i". */
const DOMAIN = /^[^\s@]+@((?:[a-z0-9-]+\.)+[a-z]{2,})$/i;

/** The domain of what is typed, lower case, or null while it is not one yet. */
const domainOf = (typed: string): string | null => DOMAIN.exec(typed.trim())?.[1]?.toLowerCase() ?? null;

/** The failure text, darkened toward the foreground so the red words reach 4.5:1 on their pale fill. */
const DANGER_TEXT = "text-[color:color-mix(in_oklch,var(--destructive),var(--foreground)_30%)]";

type Lookup =
  | { status: "idle" }
  | { status: "looking"; domain: string }
  | { status: "found"; domain: string; organisation: SsoOrganisation; providers: readonly SsoProvider[] }
  | { status: "none"; domain: string }
  | { status: "failed"; domain: string };

/**
 * Work-email sign-in for companies with single sign-on, where the domain
 * decides which button to press. Type an address and, once the domain looks
 * whole and the typing pauses, the card asks your `resolveDomain`: a spinner
 * sits inside the field while it runs and is announced politely, and typing is
 * never blocked, because the answer for a domain you have already moved away
 * from is thrown out. A company with one provider gets a button that names it
 * ("Continue with Acme SSO") under the company's name; one with several gets
 * tiles to choose from, with nothing preselected; a domain with none gets a
 * plain notice and the password route. Enter submits, and pressing it before
 * the lookup has run makes it run at once.
 */
export function SsoSignIn({
  resolveDomain,
  onContinue,
  onUsePassword,
  helpHref,
  defaultEmail = "",
  debounceMs = 450,
  footer,
  titleAs: Title = "h1",
  labels,
  className,
  ...props
}: SsoSignInProps) {
  const text: Required<SsoSignInLabels> = { ...DEFAULT_LABELS, ...labels };
  const id = useId();
  const emailField = useRef<HTMLInputElement>(null);
  const providerGroup = useRef<HTMLDivElement>(null);
  const cache = useRef(new Map<string, SsoResolution | null>());
  const run = useRef(0);
  const controller = useRef<AbortController | null>(null);
  const working = useRef(false);
  const [email, setEmail] = useState(defaultEmail);
  const [emailError, setEmailError] = useState("");
  const [lookup, setLookup] = useState<Lookup>({ status: "idle" });
  const [providerId, setProviderId] = useState("");
  const [providerError, setProviderError] = useState("");
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState("");
  const [said, setSaid] = useState({ id: 0, text: "" });

  // The latest props and words, for the lookup that was scheduled before they changed.
  const latest = useRef({ resolveDomain, text });
  useEffect(() => {
    latest.current = { resolveDomain, text };
  });

  // An answer that arrives after the card has gone is of no use to anyone, and the request can stop.
  useEffect(
    () => () => {
      run.current += 1;
      controller.current?.abort();
    },
    [],
  );

  const domain = domainOf(email);
  const say = (message: string) => setSaid((previous) => ({ id: previous.id + 1, text: message }));

  function settle(forDomain: string, result: SsoResolution | null) {
    const words = latest.current.text;
    const providers = result?.providers ?? [];
    if (!result || providers.length === 0) {
      setLookup({ status: "none", domain: forDomain });
      say(fill(words.noneSaid, { domain: forDomain }));
      return;
    }
    const organisation = typeof result.organisation === "string" ? { name: result.organisation } : result.organisation;
    setLookup({ status: "found", domain: forDomain, organisation, providers });
    // One provider needs no choice; several are never chosen for the person.
    setProviderId(providers.length === 1 ? (providers[0]?.id ?? "") : "");
    say(fill(providers.length === 1 ? words.foundSaid : words.foundManySaid, { organisation: organisation.name }));
  }

  async function lookUp(forDomain: string) {
    const ticket = ++run.current;
    controller.current?.abort();
    const mine = new AbortController();
    controller.current = mine;
    setLookup({ status: "looking", domain: forDomain });
    say(fill(latest.current.text.lookingSaid, { domain: forDomain }));
    try {
      const result = await latest.current.resolveDomain(forDomain, { signal: mine.signal });
      if (ticket !== run.current) return;
      cache.current.set(forDomain, result);
      settle(forDomain, result);
    } catch {
      if (ticket !== run.current) return;
      setLookup({ status: "failed", domain: forDomain });
      say(fill(latest.current.text.failedSaid, { domain: forDomain }));
    }
  }

  // Whenever the domain changes, what was found for the last one is gone at once: a company's name above the wrong button would be worse than a wait.
  useEffect(() => {
    run.current += 1;
    controller.current?.abort();
    setLookup({ status: "idle" });
    setProviderId("");
    setProviderError("");
    setProblem("");
    if (!domain) return;
    const known = cache.current.get(domain);
    if (known !== undefined) {
      settle(domain, known);
      return;
    }
    const timer = window.setTimeout(() => void lookUp(domain), debounceMs);
    return () => window.clearTimeout(timer);
    // The lookup reads the latest props through a ref, and a change of the delay must not restart it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domain]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (working.current) return;
    if (!EMAIL.test(email.trim()) || !domain) {
      setEmailError(text.invalid);
      emailField.current?.focus();
      return;
    }
    setEmailError("");
    if (lookup.status === "looking") return;
    if (lookup.status !== "found" || lookup.domain !== domain) {
      // Nothing is known for this address yet (or the last try failed): ask now instead of waiting for the pause.
      void lookUp(domain);
      return;
    }
    if (!providerId) {
      setProviderError(text.chooseOne);
      providerGroup.current?.querySelector<HTMLElement>("[role=radio]")?.focus();
      return;
    }
    working.current = true;
    setBusy(true);
    setProblem("");
    try {
      await onContinue({ domain, providerId });
    } catch {
      setProblem(text.continueFailed);
    } finally {
      working.current = false;
      setBusy(false);
    }
  }

  const found = lookup.status === "found" && lookup.domain === domain ? lookup : null;
  const looking = lookup.status === "looking" && lookup.domain === domain;
  const none = lookup.status === "none" && lookup.domain === domain;
  const failed = lookup.status === "failed" && lookup.domain === domain;
  const chosen = found?.providers.find((provider) => provider.id === providerId);
  const several = (found?.providers.length ?? 0) > 1;
  const continueName = found ? (several ? chosen?.name : fill(text.ssoName, { organisation: found.organisation.name })) : undefined;
  const waiting = looking || (several && !chosen);

  return (
    <div
      data-slot="sso-sign-in"
      data-state={found ? "found" : none ? "none" : failed ? "failed" : looking ? "looking" : "idle"}
      // One column that may be narrower than its widest child, so a long company name wraps inside the card instead of stretching it.
      className={cn("@container mx-auto grid w-full max-w-md grid-cols-1 gap-6 rounded-xl border border-border bg-card p-6 text-card-foreground shadow-xs sm:p-8", className)}
      {...props}
    >
      <div className="grid justify-items-start gap-4">
        <span aria-hidden="true" className="grid size-11 place-items-center rounded-full border border-border bg-muted/60 text-foreground [&_svg]:size-5">
          <IconBuilding />
        </span>
        <div className="grid gap-1.5">
          <Title className="text-xl leading-tight font-semibold tracking-[-0.03em] text-balance">{text.heading}</Title>
          <p className="text-sm leading-relaxed text-muted-foreground">{text.description}</p>
        </div>
      </div>

      <form noValidate aria-busy={looking || busy || undefined} onSubmit={(event) => void submit(event)} className="grid grid-cols-1 gap-5">
        <FormField error={emailError}>
          <FormLabel>{text.email}</FormLabel>
          <div className="relative">
            <FormControl>
              <Input
                ref={emailField}
                type="email"
                name="email"
                autoComplete="username"
                inputMode="email"
                autoCapitalize="none"
                spellCheck={false}
                placeholder="you@company.com"
                value={email}
                // Never disabled and never read-only: a slow lookup must not stop anyone typing, and the answer for an old address is dropped.
                onChange={(event) => {
                  setEmail(event.target.value);
                  if (emailError && EMAIL.test(event.target.value.trim())) setEmailError("");
                }}
                className="h-10 pr-10"
              />
            </FormControl>
            <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-muted-foreground">
              {looking ? <Spinner size={16} label="" role="presentation" aria-hidden="true" /> : found ? <IconCheck className="size-4 text-foreground" /> : null}
            </span>
          </div>
        </FormField>

        {found ? (
          <div className="grid gap-4">
            <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 p-3">
              <Avatar className="rounded-lg data-[size=default]:size-10">
                {found.organisation.logo ? <AvatarImage src={found.organisation.logo} alt="" className="rounded-lg" /> : null}
                <AvatarFallback aria-hidden="true" className="rounded-lg bg-background text-foreground ring-1 ring-border ring-inset">
                  {initialsOf(found.organisation.name) || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="grid min-w-0 gap-0.5">
                <span className="text-sm leading-snug font-medium [overflow-wrap:anywhere]">{found.organisation.name}</span>
                <span className="text-xs leading-snug text-muted-foreground [overflow-wrap:anywhere]">{fill(text.orgLine, { domain: found.domain })}</span>
              </div>
            </div>

            {several ? (
              <div ref={providerGroup} className="grid gap-2.5">
                <p className="text-sm leading-none font-medium">{text.chooseProvider}</p>
                <RadioCards
                  label={text.providerGroup}
                  value={providerId}
                  onValueChange={(next) => {
                    setProviderId(next);
                    setProviderError("");
                  }}
                  options={found.providers.map((provider) => ({ value: provider.id, title: provider.name, description: provider.description, icon: provider.icon ?? <IconKey /> }))}
                />
                <p role="status" className="text-xs font-medium text-destructive empty:hidden">
                  {providerError}
                </p>
              </div>
            ) : null}
          </div>
        ) : null}

        {none ? (
          <Alert tone="info" role="none">
            <IconInfo />
            <AlertTitle className="[overflow-wrap:anywhere]">{fill(text.noneTitle, { domain: domain ?? "" })}</AlertTitle>
            <AlertDescription>
              <p>{text.noneBody}</p>
              {helpHref ? (
                <a href={helpHref} className="w-fit rounded-sm font-medium text-foreground underline underline-offset-4 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40">
                  {text.help}
                </a>
              ) : null}
            </AlertDescription>
          </Alert>
        ) : null}

        {failed ? (
          <Alert tone="destructive" role="none" className={DANGER_TEXT}>
            <IconAlertCircle />
            <AlertTitle>{text.failedTitle}</AlertTitle>
            <AlertDescription className="text-inherit">{text.failedBody}</AlertDescription>
          </Alert>
        ) : null}

        <div role="alert" className="empty:hidden">
          {problem ? (
            <Alert tone="destructive" role="none" className={DANGER_TEXT}>
              <IconAlertCircle />
              <AlertTitle>{problem}</AlertTitle>
            </Alert>
          ) : null}
        </div>

        {none && onUsePassword ? (
          <Button type="button" size="lg" onClick={onUsePassword} className="w-full">
            {text.passwordPrimary}
          </Button>
        ) : (
          <Button
            type="submit"
            size="lg"
            // Not disabled, not even while it works: pressing it before the lookup asks for the lookup now, or points at the tiles, so it always does something,
            // and a button that stays enabled keeps the focus through a failed start. The company's name is in the label, so the label may take a few lines.
            aria-busy={busy || undefined}
            aria-disabled={(waiting && !busy) || undefined}
            className="h-auto min-h-11 w-full min-w-0 py-2.5 text-balance whitespace-normal [overflow-wrap:anywhere] aria-busy:cursor-progress aria-busy:hover:bg-primary aria-busy:active:translate-y-0 aria-disabled:cursor-default aria-disabled:bg-muted aria-disabled:text-muted-foreground aria-disabled:hover:bg-muted"
          >
            {busy ? <IconSpinner /> : null}
            {continueName ? fill(text.continueWith, { name: continueName }) : text.continue}
            {continueName && !busy ? <IconArrowRight /> : null}
          </Button>
        )}
      </form>

      {onUsePassword && !none ? (
        <Button type="button" variant="ghost" onClick={onUsePassword} className="-mt-2 w-full text-muted-foreground hover:text-foreground">
          {text.passwordQuiet}
        </Button>
      ) : null}

      {footer ? <div className="border-t border-border pt-5 text-center text-sm text-muted-foreground">{footer}</div> : null}

      <span role="status" className="sr-only">
        <span key={said.id}>{said.text}</span>
      </span>
    </div>
  );
}
