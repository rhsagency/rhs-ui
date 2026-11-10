"use client";

import { useState, type ReactNode } from "react";

import { IconCheckCircle, IconChevronLeft, IconChevronRight, IconCreditCard, IconMessage, IconSparkle, IconUserPlus } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { DotStepper } from "@rhs-ui/primitives/dot-stepper";

const STEPS = [
  { title: "Welcome to Northwind", body: "One place for your team's projects, files and decisions. Setting up takes about a minute.", icon: <IconSparkle /> },
  { title: "Invite your team", body: "Add the people you work with. They get an email and join the workspace in one click.", icon: <IconUserPlus /> },
  { title: "Connect Slack", body: "Send updates to the channel your team already reads, and reply from either side.", icon: <IconMessage /> },
  { title: "Set up billing", body: "Pick a plan now or start the 14-day trial. You can change it whenever you like.", icon: <IconCreditCard /> },
  { title: "You are ready", body: "Your workspace is set up. Create your first project to get going.", icon: <IconCheckCircle /> },
] as const;

/** A flat mountain scene, 800 by 500, that changes with the slide number. The demo needs no image files. */
function scene(slide: number): string {
  const sky = [236, 226, 217, 230][slide % 4];
  const peak = (x: number, height: number, width: number, shade: number) => `<path d='M${x - width} 400L${x} ${400 - height}L${x + width} 400Z' fill='rgb(${shade},${shade},${shade})'/>`;
  const x1 = 150 + ((slide * 131) % 260);
  const x2 = 430 + ((slide * 89) % 260);
  const sun = 90 + ((slide * 173) % 620);
  return (
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 500'>` +
    `<rect width='800' height='500' fill='rgb(${sky},${sky},${sky})'/>` +
    `<circle cx='${sun}' cy='${110 + (slide % 3) * 24}' r='38' fill='#fcfcfc'/>` +
    peak(x1, 190 + ((slide * 37) % 90), 250, 168) +
    peak(x2, 160 + ((slide * 53) % 100), 220, 132) +
    peak(x1 + 230, 110 + ((slide * 29) % 60), 200, 98) +
    `<rect y='380' width='800' height='120' fill='#26262a'/>` +
    `</svg>`
  );
}

const uri = (svg: string): string => "data:image/svg+xml;utf8," + encodeURIComponent(svg);

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <section className="grid min-w-0 content-start gap-4">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </section>
  );
}

function Onboarding(): React.JSX.Element {
  const [step, setStep] = useState(0);
  const item = STEPS[step] ?? STEPS[0];
  const last = step === STEPS.length - 1;
  return (
    <div className="grid gap-6 rounded-2xl border border-border bg-card p-6 text-card-foreground sm:p-8">
      <div className="grid min-h-[11.5rem] content-start justify-items-center gap-3 text-center">
        <span aria-hidden="true" className="grid size-14 place-items-center rounded-2xl border border-border bg-muted text-foreground [&_svg]:size-6">
          {item.icon}
        </span>
        <h2 className="mt-2 text-lg font-semibold tracking-[-0.02em]">{item.title}</h2>
        <p aria-live="polite" className="max-w-[18rem] text-sm leading-relaxed text-pretty text-muted-foreground">
          {item.body}
        </p>
      </div>
      <div className="grid justify-items-center">
        <DotStepper count={STEPS.length} value={step} onValueChange={setStep} labels={STEPS.map((entry) => entry.title)} label="Setup steps" />
      </div>
      <div className="flex items-center justify-between gap-3">
        <Button type="button" variant="ghost" onClick={() => setStep((now) => Math.max(0, now - 1))} disabled={step === 0}>
          Back
        </Button>
        <Button type="button" onClick={() => setStep((now) => Math.min(STEPS.length - 1, now + 1))}>
          {last ? "Create a project" : "Continue"}
        </Button>
      </div>
    </div>
  );
}

function Gallery(): React.JSX.Element {
  const count = 12;
  const [slide, setSlide] = useState(5);
  return (
    <div className="grid gap-3">
      <div className="relative overflow-hidden rounded-xl border border-border bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element -- a drawn picture, no loader needed */}
        <img src={uri(scene(slide))} alt={`Kestrel Ridge, photo ${slide + 1} of ${count}: a mountain range under a pale sky`} draggable={false} className="aspect-[8/5] w-full object-cover" />
        <div className="absolute inset-y-0 left-3 grid place-items-center">
          <Button type="button" variant="ghost" size="icon-sm" aria-label="Previous photo" disabled={slide === 0} onClick={() => setSlide((now) => Math.max(0, now - 1))} className="rounded-full bg-black/45 text-white hover:bg-black/60 hover:text-white">
            <IconChevronLeft />
          </Button>
        </div>
        <div className="absolute inset-y-0 right-3 grid place-items-center">
          <Button type="button" variant="ghost" size="icon-sm" aria-label="Next photo" disabled={slide === count - 1} onClick={() => setSlide((now) => Math.min(count - 1, now + 1))} className="rounded-full bg-black/45 text-white hover:bg-black/60 hover:text-white">
            <IconChevronRight />
          </Button>
        </div>
        <div className="absolute inset-x-0 bottom-3 grid justify-items-center">
          <DotStepper count={count} value={slide} onValueChange={setSlide} label="Photos" format="Photo {current} of {total}" size="sm" className="text-white" />
        </div>
      </div>
      <p className="text-xs text-muted-foreground tabular-nums">
        Kestrel Ridge, photo {slide + 1} of {count}
      </p>
    </div>
  );
}

function Sizes(): React.JSX.Element {
  const cell = "grid content-start justify-items-center gap-2 rounded-xl border border-border px-3 py-4";
  return (
    <div className="grid grid-cols-2 gap-3">
      {(["sm", "md", "lg"] as const).map((size) => (
        <div key={size} className={cell}>
          <div className="grid h-24 place-items-center">
            <DotStepper count={5} value={1} size={size} />
          </div>
          <p className="text-xs text-muted-foreground">{size}</p>
        </div>
      ))}
      <div className={cell}>
        <div className="grid h-24 place-items-center">
          <DotStepper count={5} value={1} orientation="vertical" />
        </div>
        <p className="text-xs text-muted-foreground">vertical</p>
      </div>
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="w-full">
      <div className="mx-auto grid w-full max-w-md gap-12">
        <Example caption="Onboarding in five steps. Every dot is a button named by its step; the current one is a pill.">
          <Onboarding />
        </Example>
        <Example caption="Twelve photos: past seven dots a window of five slides along, and the dots at its edges shrink.">
          <Gallery />
        </Example>
        <Example caption="Not interactive, so one image that reads 'Step 2 of 5'. Three sizes, and a column.">
          <Sizes />
        </Example>
      </div>
    </div>
  );
}
