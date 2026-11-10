"use client";

import { useState, type FormEvent, type ReactNode } from "react";

import { LikertMatrix, type MatrixOption, type MatrixStatement, type MatrixValue } from "@rhs-ui/application/likert-matrix";
import { Button } from "@rhs-ui/primitives/button";

/** A caption and the example under it. */
function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-1 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

const AGREE: readonly MatrixOption[] = [
  { value: "1", label: "Strongly disagree" },
  { value: "2", label: "Disagree" },
  { value: "3", label: "Neutral" },
  { value: "4", label: "Agree" },
  { value: "5", label: "Strongly agree" },
];

const LIKELY: readonly MatrixOption[] = [
  { value: "1", label: "Very unlikely" },
  { value: "2", label: "Unlikely" },
  { value: "3", label: "Somewhat unlikely" },
  { value: "4", label: "Neutral" },
  { value: "5", label: "Somewhat likely" },
  { value: "6", label: "Likely" },
  { value: "7", label: "Very likely" },
];

const PULSE: readonly MatrixStatement[] = [
  { id: "clarity", text: "I know what is expected of me at work." },
  { id: "feedback", text: "My manager gives me feedback I can act on." },
  { id: "tools", text: "I have the tools I need to do my job well." },
  { id: "recommend", text: "I would recommend Northwind as a place to work." },
  { id: "decisions", text: "Decisions here are explained, not just announced." },
];

const ROLLOUT: readonly MatrixStatement[] = [
  { id: "stay", text: "Keep using the new planner after the trial" },
  { id: "team", text: "Move your whole team to it" },
  { id: "friend", text: "Recommend it to a studio you know" },
];

const surface = "grid gap-5 rounded-xl border border-border bg-card p-5 text-card-foreground shadow-xs sm:p-6";

/** A survey page: the grid, a button, and what the form would send. Press Send answers with a row left empty. */
function Survey(): React.JSX.Element {
  const [result, setResult] = useState<string | null>(null);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setResult(`Thank you. We recorded ${PULSE.map((statement) => `${statement.id} ${data.get(`pulse.${statement.id}`) ?? "skipped"}`).join(", ")}.`);
  }
  return (
    <form onSubmit={submit} className={surface}>
      <LikertMatrix
        name="pulse"
        requireAll
        legend="How far do you agree with each statement?"
        description="Northwind Studio, Q3 pulse. Two minutes, and nobody sees who said what."
        statements={PULSE}
        options={AGREE}
        defaultValue={{ clarity: "4", feedback: "5", tools: "3" }}
      />
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-border pt-5">
        <Button type="submit">Send answers</Button>
        <p role="status" className="min-w-0 flex-1 basis-60 text-xs text-muted-foreground">
          {result ?? "Leave a row empty and press Send answers: the form will not send, and the grid says which rows are missing."}
        </p>
      </div>
    </form>
  );
}

export default function Demo(): React.JSX.Element {
  const [flagged, setFlagged] = useState<MatrixValue>({ clarity: "4", tools: "2" });
  const [rollout, setRollout] = useState<MatrixValue>({ stay: "6" });
  const [narrow, setNarrow] = useState<MatrixValue>({ clarity: "3" });

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-10 px-4 py-10 sm:px-6">
      <Example caption="Try it: Tab enters a row once and the arrow keys move and choose. Press Send answers with a row empty.">
        <Survey />
      </Example>

      <Example caption="After a failed submit (showErrors, here set by hand): the rows without an answer say Choose one in text, and an error lists them with a link to each.">
        <div className={surface}>
          <LikertMatrix legend="How far do you agree with each statement?" statements={PULSE} options={AGREE} requireAll showErrors value={flagged} onValueChange={setFlagged} />
        </div>
      </Example>

      <div className="grid min-w-0 gap-x-10 gap-y-10 lg:grid-cols-[22rem_minmax(0,1fr)]">
        <Example caption="In a narrow container (22rem) the same grid is one card per statement, and the scale is a vertical list.">
          <div className="max-w-[22rem] min-w-0">
            <LikertMatrix legend="How far do you agree?" statements={PULSE.slice(0, 3)} options={AGREE} value={narrow} onValueChange={setNarrow} />
          </div>
        </Example>

        <div className="grid min-w-0 grid-cols-1 content-start gap-10">
          <Example caption="Seven points do not fit, so the table scrolls inside its frame while the statement column stays in place. On a phone it becomes cards.">
            <div className="max-w-[40rem] min-w-0">
              <LikertMatrix legend="How likely are you to…" statements={ROLLOUT} options={LIKELY} value={rollout} onValueChange={setRollout} />
            </div>
          </Example>

          <Example caption="Disabled, for a survey that has closed: the answers stay readable and nothing can be changed.">
            <div className="min-w-0">
              <LikertMatrix disabled legend="How far do you agree?" statements={PULSE.slice(0, 2)} options={AGREE} defaultValue={{ clarity: "5", feedback: "2" }} />
            </div>
          </Example>
        </div>
      </div>
    </div>
  );
}
