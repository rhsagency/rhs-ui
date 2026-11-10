"use client";

import { IconPrinter } from "@rhs-ui/icons";
import { PrintLetterhead } from "@rhs-ui/marketing/print-letterhead";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

/** What the stylesheet does to a link inside the article, drawn on the paper below: the address is written after the link text. */
const PAPER_LINKS = '.demo-paper a[href^="http"]::after{content:" (" attr(href) ")";font-size:.82em;overflow-wrap:anywhere}';

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto grid max-w-5xl gap-4 px-6 py-6">
      <style dangerouslySetInnerHTML={{ __html: PAPER_LINKS }} />
      <p className="max-w-3xl text-xs leading-relaxed text-muted-foreground">
        PrintLetterhead renders nothing on screen. On the left, the page as people read it; on the right, the same page as it comes out of the printer: the letterhead is the component's own, and the small line at the foot is drawn the way the browser prints it, in the bottom page margin of every page, outside the text where nothing can run into it. Press the button, or Ctrl+P, to print this very page and see the stylesheet take the navigation and the cookie notice off it.
      </p>

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-2">
        <figure className="grid gap-3">
          <figcaption className="flex h-8 items-center justify-between gap-4 text-xs font-medium text-muted-foreground">
            On screen
            <Button size="sm" variant="outline" type="button" onClick={() => window.print()} data-print-hide="">
              <IconPrinter aria-hidden="true" />
              Print this page
            </Button>
          </figcaption>
          <div className="overflow-hidden rounded-xl border border-border bg-background">
            <nav aria-label="Demo site" className="flex h-12 items-center justify-between border-b border-border px-5 text-sm">
              <span className="font-semibold tracking-[-0.03em]">Halcyon</span>
              <span className="flex gap-5 text-muted-foreground">
                <span>Product</span>
                <span>Pricing</span>
                <span>Log in</span>
              </span>
            </nav>
            <div className="px-5 py-6">
              <Terms />
            </div>
            <div data-print-hide="" className="flex items-center justify-between gap-4 border-t border-border bg-muted px-5 py-3 text-xs text-muted-foreground">
              <span>We use cookies to remember your plan.</span>
              <span className="rounded-md bg-primary px-3 py-1.5 font-medium text-primary-foreground">Accept</span>
            </div>
          </div>
        </figure>

        <figure className="grid gap-3">
          <figcaption className="flex h-8 items-center text-xs font-medium text-muted-foreground">On paper</figcaption>
          <div
            className={cn(
              // The paper keeps the light palette in dark mode too, as the stylesheet does when printing; the letterhead is the component's own, shown on screen here.
              "light demo-paper flex min-h-[36rem] w-full flex-col rounded-sm bg-background p-7 text-foreground shadow-sm ring-1 ring-border sm:p-9",
              "[&>[data-slot=print-letterhead]]:mb-5 [&>[data-slot=print-letterhead]]:block!",
            )}
          >
            <PrintLetterhead
              brand={<span className="text-xl font-semibold tracking-[-0.04em]">Halcyon</span>}
              details={{ address: ["Halcyon Scheduling B.V.", "Westerlaan 14, 3016 CK Rotterdam"], phone: "+31 10 555 0142", email: "legal@halcyon.example" }}
              url="halcyon.example/legal/terms"
              locale="en-GB"
              timeZone="Europe/Amsterdam"
            />
            <div className="flex-1 pb-6">
              <Terms paper />
            </div>
            {/* What the browser prints in the bottom margin of this page. Hidden when the demo itself is printed, because the real margin footer is there then. */}
            <p data-print-hide="" className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-0.5 text-[8pt] leading-snug text-muted-foreground">
              <span className="break-all">halcyon.example/legal/terms</span>
              <span className="tabular-nums">Printed 10 November 2026 &middot; Page 1 of 1</span>
            </p>
          </div>
        </figure>
      </div>
    </div>
  );
}

function Terms({ paper = false }: { paper?: boolean }): React.JSX.Element {
  return (
    <article className={paper ? "text-[10.5px] leading-[1.55]" : "text-[0.8125rem] leading-relaxed"}>
      <h2 className={cn("font-medium tracking-[-0.03em]", paper ? "text-base" : "text-xl")}>Terms of service</h2>
      <p className="mt-1 text-muted-foreground">Last updated 3 November 2026</p>
      <p className="mt-3">
        By creating an account you agree to these terms and to our{" "}
        <a href="https://www.halcyon.example/legal/privacy" className="underline underline-offset-2">
          privacy statement
        </a>
        . Halcyon plans the week for your team; you remain responsible for what you put in it.
      </p>
      <h3 className="mt-4 font-medium">1. Plans and limits</h3>
      <table className="mt-2 w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-border">
            <th className="py-1.5 pr-3 font-medium">Plan</th>
            <th className="py-1.5 pr-3 font-medium">Seats</th>
            <th className="py-1.5 font-medium">Support</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-border">
            <td className="py-1.5 pr-3">Starter</td>
            <td className="py-1.5 pr-3 tabular-nums">3</td>
            <td className="py-1.5">Email, two days</td>
          </tr>
          <tr className="border-b border-border">
            <td className="py-1.5 pr-3">Studio</td>
            <td className="py-1.5 pr-3 tabular-nums">10</td>
            <td className="py-1.5">Email, same day</td>
          </tr>
          <tr>
            <td className="py-1.5 pr-3">Agency</td>
            <td className="py-1.5 pr-3 tabular-nums">50</td>
            <td className="py-1.5">Phone and email</td>
          </tr>
        </tbody>
      </table>
      <h3 className="mt-4 font-medium">2. Ending the agreement</h3>
      <p className="mt-1">
        You can cancel at any time from your account page. We keep your data for thirty days afterwards and then delete it; the{" "}
        <a href="https://www.halcyon.example/help/export" className="underline underline-offset-2">
          export guide
        </a>{" "}
        shows how to take a copy first.
      </p>
    </article>
  );
}
