"use client";

import { useState, type FormEvent, type ReactNode } from "react";

import { Button } from "@rhs-ui/primitives/button";
import { LikertScale, type LikertValue } from "@rhs-ui/primitives/likert-scale";

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-1 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

const card = "grid gap-8 rounded-xl border border-border bg-card p-5 shadow-xs sm:p-6";

function Survey(): React.JSX.Element {
  const [result, setResult] = useState<string | null>(null);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setResult(`Thank you. We recorded ${["clarity", "feedback", "onboarding"].map((key) => `${key} ${data.get(key) ?? "skipped"}`).join(", ")}.`);
  }
  return (
    <form onSubmit={submit} className={card}>
      <div className="grid gap-1">
        <h2 className="text-sm font-medium tracking-[-0.01em]">Kestrel team survey, October</h2>
        <p className="text-xs text-muted-foreground">Three statements, two minutes. Answers are anonymous, and a star marks the ones we need.</p>
      </div>
      <LikertScale name="clarity" required legend="I know what is expected of me at work." defaultValue={4} />
      <LikertScale name="feedback" required legend="My manager gives me feedback I can act on." />
      <LikertScale name="onboarding" legend="The onboarding checklist made my first week easier." notApplicable />
      <Button type="submit">Send answers</Button>
      <p role="status" className="min-h-4 border-t border-border pt-4 text-xs text-muted-foreground">
        {result ?? "Press Send answers without choosing for the second statement: the group says what is missing."}
      </p>
    </form>
  );
}

export default function Demo(): React.JSX.Element {
  const [recommend, setRecommend] = useState<LikertValue>(6);
  const [often, setOften] = useState<LikertValue>(null);
  return (
    <div className="grid w-full max-w-3xl gap-9">
      <Example caption="Try it: Tab enters a statement once and the arrow keys move and choose. Press Send answers with a required one empty.">
        <Survey />
      </Example>

      <div className="grid gap-x-10 gap-y-9 md:grid-cols-2 md:items-start">
        <Example caption="Seven points with numbers. The answer is reported as a number.">
          <div className="grid gap-4 rounded-xl border border-border bg-card p-5 shadow-xs">
            <LikertScale points={7} showNumbers legend="I would recommend Northwind to a colleague." value={recommend} onValueChange={setRecommend} />
            <p role="status" className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-t border-border pt-4 text-xs text-muted-foreground">
              <span>Reported</span>
              <code className="font-mono text-[0.6875rem] text-foreground">{JSON.stringify(recommend)}</code>
            </p>
          </div>
        </Example>

        <div className="grid min-w-0 content-start gap-9">
          <Example caption="Your own labels, and an error from outside">
            <LikertScale legend="How often do you work from the office?" options={["Never", "Rarely", "Sometimes", "Often", "Always"]} value={often} onValueChange={setOften} error={often === null ? "Choose how often, or skip this page" : undefined} />
          </Example>
          <Example caption="Disabled">
            <LikertScale disabled legend="The pricing page is easy to understand." defaultValue={2} />
          </Example>
        </div>
      </div>
    </div>
  );
}
