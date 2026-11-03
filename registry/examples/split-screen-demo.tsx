"use client";

import { useId, useState, type ReactNode } from "react";

import { SegmentedControl } from "@rhs-ui/application/segmented-control";
import { Button } from "@rhs-ui/primitives/button";
import { Checkbox } from "@rhs-ui/primitives/checkbox";
import { Input } from "@rhs-ui/primitives/input";
import { Label } from "@rhs-ui/primitives/label";
import { SplitScreen, type SplitScreenMobile } from "@rhs-ui/primitives/split-screen";
import { Switch } from "@rhs-ui/primitives/switch";

const svg = (body: string) => `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 1000' preserveAspectRatio='xMidYMid slice'>${body}</svg>`)}`;

/** A quiet landscape, flat: a pale sun over two ridges. It is a cover, so it is cropped to whatever box it gets. */
const RIDGE = svg(
  [
    "<rect width='800' height='1000' fill='#dedbd2'/>",
    "<circle cx='560' cy='300' r='92' fill='#f3f1eb'/>",
    "<path d='M0 640 L170 440 L310 580 L470 390 L650 570 L800 480 L800 1000 L0 1000Z' fill='#5a5e65'/>",
    "<path d='M0 760 L210 600 L360 720 L530 560 L700 700 L800 650 L800 1000 L0 1000Z' fill='#2b2e32'/>",
  ].join(""),
);

/** The same landscape, wider and lower, for a strip. */
const STRIP = svg(
  [
    "<rect width='800' height='1000' fill='#dedbd2'/>",
    "<circle cx='580' cy='420' r='110' fill='#f3f1eb'/>",
    "<path d='M0 560 L170 380 L310 500 L470 340 L650 500 L800 420 L800 1000 L0 1000Z' fill='#5a5e65'/>",
    "<path d='M0 700 L210 540 L360 650 L530 500 L700 640 L800 590 L800 1000 L0 1000Z' fill='#2b2e32'/>",
  ].join(""),
);

function Field({ label, type = "text", placeholder, hint, autoComplete }: { label: string; type?: string; placeholder: string; hint?: string; autoComplete?: string }): React.JSX.Element {
  const id = useId();
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} placeholder={placeholder} autoComplete={autoComplete} />
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

/** A form taller than the frame it sits in, so there is something to scroll past a picture that is pinned. */
function SignUp(): React.JSX.Element {
  const terms = useId();
  return (
    <div className="grid gap-6">
      <div>
        <p className="text-sm font-semibold tracking-[-0.02em]">halcyon</p>
        <h2 className="mt-7 text-2xl font-semibold tracking-[-0.035em] text-balance">Create your workspace</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">Free for 30 days. No card needed.</p>
      </div>
      <form className="grid gap-4" onSubmit={(event) => event.preventDefault()}>
        <Field label="Full name" placeholder="Maya Chen" autoComplete="name" />
        <Field label="Work email" type="email" placeholder="maya@northwind.example" autoComplete="email" />
        <Field label="Company" placeholder="Northwind Traders" hint="The name on your invoices. You can change it later." autoComplete="organization" />
        <Field label="Password" type="password" placeholder="At least 12 characters" hint="Use a phrase you will remember, not a word." autoComplete="new-password" />
        <div className="flex items-start gap-2.5">
          <Checkbox id={terms} className="mt-px" />
          <Label htmlFor={terms} className="text-sm leading-snug font-normal text-muted-foreground">
            I agree to the terms of service and the privacy notice.
          </Label>
        </div>
        <Button type="submit" className="mt-1">
          Create workspace
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        Already have a workspace?{" "}
        <a href="#sign-in" className="rounded-sm font-medium text-foreground underline underline-offset-4 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40">
          Sign in
        </a>
      </p>
    </div>
  );
}

function Waitlist(): React.JSX.Element {
  const id = useId();
  return (
    <form className="grid gap-4" onSubmit={(event) => event.preventDefault()}>
      <div>
        <p className="text-sm font-semibold tracking-[-0.02em]">kestrel</p>
        <h2 className="mt-5 text-xl font-semibold tracking-[-0.03em] text-balance">Join the waitlist</h2>
        <p className="mt-1 text-sm text-muted-foreground">The spring pack drops on 14 March. We email once.</p>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor={id}>Email</Label>
        <Input id={id} type="email" placeholder="you@example.com" autoComplete="email" />
      </div>
      <Button type="submit">Save my place</Button>
      <p className="text-xs text-muted-foreground">12,480 people are ahead of you.</p>
    </form>
  );
}

/** The height of the sign-up window and of a phone. The border takes 1px on each side, so the layout inside is told 2px less, or the window would scroll by those 2px. */
const HERO_HEIGHT = "33rem";
const PHONE_HEIGHT = "36rem";
const inside = (height: string) => `calc(${height} - 2px)`;

/** A box that stands in for the browser window: a fixed height, scrolling inside, so the layout fills it instead of the page. */
function Screen({ height, width, children }: { height: string; width?: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="relative overflow-y-auto rounded-xl border border-border bg-background shadow-xs" style={{ height, width, maxWidth: "100%" }}>
      {children}
    </div>
  );
}

const MOBILE: readonly { mode: SplitScreenMobile; title: string; note: string }[] = [
  { mode: "hidden", title: "hidden", note: "The picture is gone and the form fills the screen." },
  { mode: "banner", title: "banner", note: "A short strip above the form. The form stays above the fold." },
  { mode: "top", title: "top", note: "A taller block above the form, for a brand moment." },
];

export default function Demo(): React.JSX.Element {
  const [ratio, setRatio] = useState<"1:1" | "3:2">("1:1");
  const [side, setSide] = useState<"start" | "end">("end");
  const [pinned, setPinned] = useState(true);
  return (
    <div className="mx-auto grid w-full max-w-6xl gap-12 px-4 py-8 sm:px-6">
      <section aria-labelledby="split-wide" className="@container">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
          <div>
            <h2 id="split-wide" className="text-lg font-semibold tracking-[-0.02em]">
              Sign-up, edge to edge
            </h2>
            <p className="mt-0.5 max-w-xl text-sm text-muted-foreground">
              <span className="@[48.125rem]:hidden">In a window narrower than 48rem the picture folds into a strip above the form. Below are the three ways a phone can show it.</span>
              <span className="hidden @[48.125rem]:inline">The task on one half, a picture on the other. Neither has a card around it. Scroll the form: a pinned picture stays where it is.</span>
            </p>
          </div>
          {/* The three controls change a layout of two halves, which needs 48rem of window (and 2px of border): below that there is only a strip, and nothing to choose. */}
          <div className="hidden flex-wrap items-center gap-x-5 gap-y-3 @[48.125rem]:flex">
            <SegmentedControl
              label="Ratio"
              value={ratio}
              onValueChange={(value) => setRatio(value === "3:2" ? "3:2" : "1:1")}
              options={[
                { value: "1:1", label: "1:1" },
                { value: "3:2", label: "3:2" },
              ]}
            />
            <SegmentedControl
              label="Side of the picture"
              value={side}
              onValueChange={(value) => setSide(value === "start" ? "start" : "end")}
              options={[
                { value: "start", label: "Left" },
                { value: "end", label: "Right" },
              ]}
            />
            <div className="flex items-center gap-2.5">
              <Label htmlFor="split-pin" className="text-sm">
                Pin the picture
              </Label>
              <Switch id="split-pin" checked={pinned} onCheckedChange={setPinned} />
            </div>
          </div>
        </div>
        <Screen height={HERO_HEIGHT}>
          {/* Every layout here makes its main a div: the page that frames a demo has the main landmark already. A strip of picture keeps the narrow window from losing it. */}
          <SplitScreen
            height={inside(HERO_HEIGHT)}
            mainAs="div"
            mediaOnMobile="banner"
            ratio={ratio}
            mediaSide={side}
            stickyMedia={pinned}
            mediaLabel="A customer story"
            media={
              <div className="relative size-full @3xl:min-h-[22rem]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={RIDGE} alt="" className="absolute inset-0 size-full object-cover" />
                {/* In the strip there is no room for the quote: it belongs to the wide layout, where the picture is a half. */}
                <figure className="absolute inset-x-6 bottom-6 hidden rounded-xl border border-border bg-background p-5 shadow-sm @3xl:block">
                  <blockquote className="text-sm leading-relaxed text-pretty">
                    “We moved four shops onto Halcyon over a weekend. Monday morning nobody asked where anything had gone.”
                  </blockquote>
                  <figcaption className="mt-3 text-xs text-muted-foreground">Marit Hoekstra, operations lead at Kestrel</figcaption>
                </figure>
              </div>
            }
          >
            <SignUp />
          </SplitScreen>
        </Screen>
      </section>

      <section aria-labelledby="split-narrow">
        <h2 id="split-narrow" className="text-lg font-semibold tracking-[-0.02em]">
          On a phone
        </h2>
        <p className="mt-0.5 mb-5 text-sm text-muted-foreground">Below 48rem of width the halves stack. You choose what happens to the picture.</p>
        <div className="grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {MOBILE.map(({ mode, title, note }) => (
            <figure key={mode} className="grid min-w-0 content-start justify-items-center gap-3 sm:justify-items-start">
              <Screen height={PHONE_HEIGHT} width="19rem">
                <SplitScreen height={inside(PHONE_HEIGHT)} mainAs="div" mediaOnMobile={mode} media={<img src={STRIP} alt="" className="absolute inset-0 size-full object-cover" />}>
                  <Waitlist />
                </SplitScreen>
              </Screen>
              <figcaption className="max-w-[19rem] text-xs text-muted-foreground">
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-foreground">mediaOnMobile=&quot;{title}&quot;</code>
                <span className="mt-1.5 block">{note}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>
    </div>
  );
}
