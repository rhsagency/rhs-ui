"use client";

import { useId, useState, type ComponentProps, type FormEvent, type ReactNode } from "react";

import { IconAlertCircle, IconCheck } from "@rhs-ui/icons";
import { Alert, AlertDescription } from "@rhs-ui/primitives/alert";
import { Button } from "@rhs-ui/primitives/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@rhs-ui/primitives/card";
import { FormControl, FormDescription, FormField, FormLabel } from "@rhs-ui/primitives/form-field";
import { Input } from "@rhs-ui/primitives/input";
import { LabeledDivider } from "@rhs-ui/primitives/labeled-divider";
import { PasswordInput } from "@rhs-ui/primitives/password-input";
import { cn } from "@/lib/utils";

export interface SignInCredentials {
  /** The email address as it was typed, trimmed. It has passed the check for something@somewhere.tld. */
  email: string;
  /** The password exactly as it was typed. It is never empty. */
  password: string;
}

/** What a callback may give back: nothing when it worked, or the sentence to show when it did not. */
type Outcome = string | void | undefined | Promise<string | void | undefined>;

export interface CheckoutSignInChoiceLabels {
  /** The heading above both cards. */
  title?: string;
  /** The line under it. */
  description?: string;
  /** The title of the sign-in card. */
  signInTitle?: string;
  /** Under it. */
  signInDescription?: string;
  /** The title of the guest card. */
  guestTitle?: string;
  /** Under it. */
  guestDescription?: string;
  /** The label of both email fields. */
  email?: string;
  /** The label of the password field. */
  password?: string;
  /** The link beside the password field. */
  forgot?: string;
  /** The sign-in button. */
  signIn?: string;
  /** The guest button. */
  continueAsGuest?: string;
  /** Under the guest's email: why it is asked. */
  emailHint?: string;
  /** The word on the rule above the providers. */
  or?: string;
  /** The heading of the list of what an account adds. */
  accountAdds?: string;
  /** The link to create an account. */
  createAccount?: string;
  /** An email field left empty. */
  emailRequired?: string;
  /** An email that is not an address. */
  emailInvalid?: string;
  /** A password field left empty. */
  passwordRequired?: string;
  /** Said when a callback fails without a message. */
  failed?: string;
}

const WORDS = {
  title: "How would you like to check out?",
  description: "Sign in for a faster checkout, or continue as a guest. You do not need an account to order.",
  signInTitle: "Returning customer",
  signInDescription: "Sign in to use your saved details and see your orders.",
  guestTitle: "New here?",
  guestDescription: "Check out as a guest with just your email.",
  email: "Email",
  password: "Password",
  forgot: "Forgot password?",
  signIn: "Sign in",
  continueAsGuest: "Continue as guest",
  emailHint: "We only use it to send your order confirmation.",
  or: "or",
  accountAdds: "With an account you also get",
  createAccount: "Create an account",
  emailRequired: "Enter your email address.",
  emailInvalid: "Enter an email address like name@example.com.",
  passwordRequired: "Enter your password.",
  failed: "Something went wrong. Try again.",
} satisfies Required<CheckoutSignInChoiceLabels>;

const BENEFITS = ["Track every order from your phone", "Check out faster next time", "Keep your addresses and returns in one place"] as const;

export interface CheckoutSignInChoiceProps extends Omit<ComponentProps<"section">, "children" | "title"> {
  /** Called with the email and password once both are filled in. Return, or resolve to, the sentence to show when the sign-in fails ("That email and password do not match."); return nothing when it worked. */
  onSignIn: (credentials: SignInCredentials) => Outcome;
  /** Called with the email of a guest. Same contract: nothing when it worked, a sentence when it did not. */
  onContinueAsGuest: (email: string) => Outcome;
  /** Called when the person chooses to create an account. Pass `createAccountHref` instead for a plain link. */
  onCreateAccount?: () => void;
  /** Where creating an account goes, when that is a page. */
  createAccountHref?: string;
  /** Other ways to sign in, under the form after a rule: a passkey, a link by email. */
  providers?: ReactNode;
  /** Where "Forgot password?" goes. Without it the link is left out. */
  forgotHref?: string;
  /** What an account adds, one short line each. Three read best. */
  benefits?: readonly string[];
  /** The email to start the sign-in form with, for someone who is known. */
  defaultEmail?: string;
  /** The heading's element: "h1" (the default) when this opens the page, "h2" inside a page that has one. The cards' titles sit one level below. */
  headingAs?: "h1" | "h2";
  /** The words, for another language. */
  labels?: CheckoutSignInChoiceLabels;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * The fork before checkout: sign in, or continue as a guest with nothing but an email. Two cards side by side,
 * the guest one first on a phone because it is the faster way. The sign-in card has the email, the password with
 * its forgot link and room for other ways in; the guest card says why the email is asked and lists what an
 * account would add. Each form checks itself when it is sent, puts the error under the field and moves focus
 * there, and announces what a failed callback says; neither form can hold up the other. Each card is a labelled
 * region under the page's one heading.
 */
export function CheckoutSignInChoice({
  onSignIn,
  onContinueAsGuest,
  onCreateAccount,
  createAccountHref,
  providers,
  forgotHref,
  benefits = BENEFITS,
  defaultEmail,
  headingAs = "h1",
  labels,
  className,
  ...props
}: CheckoutSignInChoiceProps) {
  const words = { ...WORDS, ...labels };
  const id = useId();
  const Heading = headingAs;
  const CardHeading = headingAs === "h1" ? "h2" : "h3";
  const [signInErrors, setSignInErrors] = useState({ email: "", password: "" });
  const [signInFailure, setSignInFailure] = useState("");
  const [signingIn, setSigningIn] = useState(false);
  const [guestError, setGuestError] = useState("");
  const [guestFailure, setGuestFailure] = useState("");
  const [continuing, setContinuing] = useState(false);

  const emailProblem = (value: string) => (value === "" ? words.emailRequired : EMAIL.test(value) ? "" : words.emailInvalid);
  const focusField = (form: HTMLFormElement, name: string) => {
    const field = form.elements.namedItem(name);
    if (field instanceof HTMLElement) field.focus();
  };

  async function submitSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const email = String(data.get("email") ?? "").trim();
    const password = String(data.get("password") ?? "");
    const next = { email: emailProblem(email), password: password === "" ? words.passwordRequired : "" };
    setSignInErrors(next);
    setSignInFailure("");
    if (next.email || next.password) {
      focusField(form, next.email ? "email" : "password");
      return;
    }
    setSigningIn(true);
    try {
      const outcome = await onSignIn({ email, password });
      if (outcome) setSignInFailure(outcome);
    } catch {
      setSignInFailure(words.failed);
    } finally {
      setSigningIn(false);
    }
  }

  async function submitGuest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const email = String(new FormData(form).get("guestEmail") ?? "").trim();
    const problem = emailProblem(email);
    setGuestError(problem);
    setGuestFailure("");
    if (problem) {
      focusField(form, "guestEmail");
      return;
    }
    setContinuing(true);
    try {
      const outcome = await onContinueAsGuest(email);
      if (outcome) setGuestFailure(outcome);
    } catch {
      setGuestFailure(words.failed);
    } finally {
      setContinuing(false);
    }
  }

  const failure = (message: string) =>
    message ? (
      <Alert tone="destructive" role="alert">
        <IconAlertCircle aria-hidden="true" />
        <AlertDescription className="text-foreground">{message}</AlertDescription>
      </Alert>
    ) : null;

  return (
    <section data-slot="checkout-sign-in-choice" className={cn("mx-auto w-full max-w-4xl py-10 sm:py-14", className)} {...props}>
      <header className="mx-auto max-w-xl text-center">
        <Heading className="text-3xl leading-[1.1] font-medium tracking-[-0.04em] text-balance sm:text-4xl">{words.title}</Heading>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground text-pretty">{words.description}</p>
      </header>

      <div className="mt-10 grid gap-6 md:grid-cols-2 md:items-stretch">
        {/* Side by side the two cards are subgrids that share a header row and a content row. A taller neighbour stretches a card's rows, so every grid inside is pinned to the top: the spare height collects at the bottom of the shorter card and never opens a gap between a title and its description or between two fields. */}
        <Card role="region" aria-labelledby={`${id}-sign-in`} className="min-w-0 md:row-span-2 md:grid md:grid-cols-[minmax(0,1fr)] md:grid-rows-subgrid">
          <CardHeader className="content-start">
            <CardTitle asChild>
              <CardHeading id={`${id}-sign-in`} className="text-lg tracking-[-0.02em]">
                {words.signInTitle}
              </CardHeading>
            </CardTitle>
            <CardDescription>{words.signInDescription}</CardDescription>
          </CardHeader>
          <CardContent className="grid content-start gap-5">
            <form noValidate onSubmit={submitSignIn} className="grid content-start gap-4">
              <FormField error={signInErrors.email}>
                <FormLabel>{words.email}</FormLabel>
                <FormControl>
                  <Input name="email" type="email" inputMode="email" autoComplete="username" defaultValue={defaultEmail} onChange={() => signInErrors.email && setSignInErrors((current) => ({ ...current, email: "" }))} />
                </FormControl>
              </FormField>
              <FormField error={signInErrors.password}>
                <div className="flex items-center justify-between gap-3">
                  <FormLabel>{words.password}</FormLabel>
                  {forgotHref ? (
                    <a href={forgotHref} className="rounded-sm text-sm text-muted-foreground underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/40">
                      {words.forgot}
                    </a>
                  ) : null}
                </div>
                <FormControl>
                  <PasswordInput name="password" autoComplete="current-password" onChange={() => signInErrors.password && setSignInErrors((current) => ({ ...current, password: "" }))} />
                </FormControl>
              </FormField>
              {failure(signInFailure)}
              <Button type="submit" size="lg" loading={signingIn} className="w-full">
                {words.signIn}
              </Button>
            </form>
            {providers ? (
              <div className="grid gap-4">
                <LabeledDivider>{words.or}</LabeledDivider>
                <div className="grid gap-2">{providers}</div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card role="region" aria-labelledby={`${id}-guest`} className="min-w-0 max-md:order-first md:row-span-2 md:grid md:grid-cols-[minmax(0,1fr)] md:grid-rows-subgrid">
          <CardHeader className="content-start">
            <CardTitle asChild>
              <CardHeading id={`${id}-guest`} className="text-lg tracking-[-0.02em]">
                {words.guestTitle}
              </CardHeading>
            </CardTitle>
            <CardDescription>{words.guestDescription}</CardDescription>
          </CardHeader>
          <CardContent className="grid content-start gap-6">
            <form noValidate onSubmit={submitGuest} className="grid content-start gap-4">
              <FormField error={guestError} described>
                <FormLabel>{words.email}</FormLabel>
                <FormControl>
                  <Input name="guestEmail" type="email" inputMode="email" autoComplete="email" onChange={() => guestError && setGuestError("")} />
                </FormControl>
                <FormDescription>{words.emailHint}</FormDescription>
              </FormField>
              {failure(guestFailure)}
              <Button type="submit" size="lg" loading={continuing} className="w-full">
                {words.continueAsGuest}
              </Button>
            </form>

            <div className="border-t border-border pt-5">
              <p className="text-sm font-medium">{words.accountAdds}</p>
              <ul className="mt-3 grid gap-2.5">
                {benefits.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <IconCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-foreground" />
                    <span className="min-w-0">{benefit}</span>
                  </li>
                ))}
              </ul>
              {createAccountHref || onCreateAccount ? (
                <Button asChild={Boolean(createAccountHref)} type={createAccountHref ? undefined : "button"} variant="link" onClick={createAccountHref ? undefined : onCreateAccount} className="mt-3 h-auto p-0 underline">
                  {createAccountHref ? <a href={createAccountHref}>{words.createAccount}</a> : words.createAccount}
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
