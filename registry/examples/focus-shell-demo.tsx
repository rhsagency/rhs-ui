"use client";

import { useState, type FormEvent, type ReactNode } from "react";

import { FocusShell } from "@rhs-ui/application/focus-shell";
import { IconArrowLeft } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { Input } from "@rhs-ui/primitives/input";
import { Label } from "@rhs-ui/primitives/label";
import { LabeledDivider } from "@rhs-ui/primitives/labeled-divider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@rhs-ui/primitives/select";

const Brand = () => (
  <span className="flex items-center gap-2.5">
    <span className="grid size-6 place-items-center rounded-lg bg-foreground text-background">
      <svg viewBox="0 0 16 16" aria-hidden="true" className="size-3.5" fill="currentColor">
        <path d="M2 12.5a6 6 0 0 1 12 0z" />
      </svg>
    </span>
    Halcyon
  </span>
);

function Frame({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <figure className="grid gap-2">
      <figcaption className="text-xs text-muted-foreground">{caption}</figcaption>
      {children}
    </figure>
  );
}

export default function Demo(): React.JSX.Element {
  const [language, setLanguage] = useState("en");
  const [saved, setSaved] = useState(false);

  const legal = (
    <>
      <a href="#terms">Terms</a>
      <a href="#privacy">Privacy</a>
      <a href="#help">Help</a>
    </>
  );
  const languages = (
    <Select value={language} onValueChange={setLanguage}>
      <SelectTrigger size="sm" aria-label="Language" className="w-36">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="en">English</SelectItem>
        <SelectItem value="nl">Nederlands</SelectItem>
        <SelectItem value="de">Deutsch</SelectItem>
      </SelectContent>
    </Select>
  );
  const hold = (event: FormEvent) => event.preventDefault();

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-8 px-4 py-6 sm:px-6">
      <Frame caption="Centred in the default 32rem column: a sign-in page with nothing to wander off to.">
        <div className="overflow-hidden rounded-xl border border-border">
          <FocusShell
            mainId="focus-main"
            className="min-h-[38rem]"
            brand={<Brand />}
            exit={
              <Button asChild variant="ghost" size="sm">
                <a href="#site">
                  <IconArrowLeft />
                  Back to halcyon.studio
                </a>
              </Button>
            }
            footer={legal}
            language={languages}
          >
            <h2 className="text-2xl font-semibold tracking-[-0.03em]">Sign in to Halcyon</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">Welcome back. Use your work email to open your workspace.</p>
            <form onSubmit={hold} className="mt-8 grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="focus-email">Email</Label>
                <Input id="focus-email" type="email" autoComplete="email" placeholder="you@company.com" />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="focus-password">Password</Label>
                  <a href="#forgot" className="rounded-sm text-sm text-muted-foreground underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/40">
                    Forgot password?
                  </a>
                </div>
                <Input id="focus-password" type="password" autoComplete="current-password" />
              </div>
              <Button type="submit" size="lg" className="mt-1 w-full">
                Sign in
              </Button>
              <LabeledDivider className="my-1">or</LabeledDivider>
              <Button type="button" variant="outline" size="lg" className="w-full">
                Continue with single sign-on
              </Button>
            </form>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              New to Halcyon?{" "}
              <a href="#signup" className="rounded-sm font-medium text-foreground underline underline-offset-4 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40">
                Create an account
              </a>
            </p>
          </FocusShell>
        </div>
      </Frame>

      <Frame caption="Wide (44rem) and aligned to the top, for a longer form.">
        <div className="overflow-hidden rounded-xl border border-border">
          <FocusShell
            mainId="focus-main-wide"
            className="min-h-[36rem]"
            width="wide"
            align="top"
            brand={<Brand />}
            exit={
              <Button asChild variant="ghost" size="sm">
                <a href="#cart">Cancel and return to cart</a>
              </Button>
            }
            footer={legal}
          >
            <h2 className="text-2xl font-semibold tracking-[-0.03em]">Where should we deliver?</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">Orders placed before 16:00 on a working day ship the same day.</p>
            <form
              onSubmit={(event) => {
                hold(event);
                setSaved(true);
              }}
              className="mt-8 grid gap-4 sm:grid-cols-2"
            >
              <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor="focus-name">Full name</Label>
                <Input id="focus-name" autoComplete="name" defaultValue="Mara Okafor" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="focus-street">Street</Label>
                <Input id="focus-street" autoComplete="address-line1" defaultValue="Keizersgracht" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="focus-number">House number</Label>
                <Input id="focus-number" autoComplete="address-line2" defaultValue="412" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="focus-postcode">Postcode</Label>
                <Input id="focus-postcode" autoComplete="postal-code" defaultValue="1016 GH" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="focus-city">City</Label>
                <Input id="focus-city" autoComplete="address-level2" defaultValue="Amsterdam" />
              </div>
              <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor="focus-country">Country</Label>
                <Select defaultValue="NL">
                  <SelectTrigger id="focus-country">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NL">Netherlands</SelectItem>
                    <SelectItem value="BE">Belgium</SelectItem>
                    <SelectItem value="DE">Germany</SelectItem>
                    <SelectItem value="FR">France</SelectItem>
                    <SelectItem value="LU">Luxembourg</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 sm:col-span-2">
                <p role="status" className="text-sm text-muted-foreground">
                  {saved ? "Address saved." : "Delivery to this address is free."}
                </p>
                <Button type="submit" size="lg">
                  Save and continue
                </Button>
              </div>
            </form>
          </FocusShell>
        </div>
      </Frame>
    </div>
  );
}
