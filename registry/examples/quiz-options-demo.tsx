"use client";

import { useState, type ReactNode } from "react";

import { QuizOptions, type QuizOption, type QuizStatus } from "@rhs-ui/application/quiz-options";
import { IconCheckCircle, IconInfo } from "@rhs-ui/icons";

/** A caption and the example under it. */
function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

const LEAVER: readonly QuizOption[] = [
  { value: "delete", label: "Delete their account straight away", reason: "Deleting the account takes the history of their tasks with it. Reassign first." },
  { value: "reassign", label: "Reassign their open tasks, then deactivate the account", reason: "Reassigning first keeps the history and the due dates, and the new owner is told." },
  { value: "leave", label: "Leave the tasks as they are", reason: "Nobody is notified, so the tasks quietly go overdue." },
  { value: "archive", label: "Archive the whole project", reason: "That hides work other people still need." },
];

const PHISHING: readonly QuizOption[] = [
  { value: "sender", label: "A sender address that almost matches ours", reason: "northwind-support.co is not northwind.example. Check the domain, not the name." },
  { value: "urgency", label: "A request to act within the hour", reason: "Urgency is how phishing stops you thinking." },
  { value: "link", label: "A link whose text and destination differ", reason: "Hover over it: the address at the bottom of the window is the real one." },
  { value: "greeting", label: "A message that greets you by your first name", reason: "Names are easy to find. A greeting alone proves nothing." },
];

/** The verdict is the page's job: the question only reports whether the answer was right. */
function Verdict({ result }: { result: boolean | null }): React.JSX.Element {
  return (
    <p role="status" className="flex min-h-5 items-center gap-2 text-xs leading-5 text-muted-foreground">
      {result === null ? (
        <>
          <IconInfo aria-hidden="true" className="size-3.5 shrink-0" />
          Your page writes the verdict here, from what onCheck reports.
        </>
      ) : result ? (
        <>
          <IconCheckCircle aria-hidden="true" className="size-3.5 shrink-0 text-foreground" />
          <span className="font-medium text-foreground">Right. Lesson 3 of 5 is unlocked.</span>
        </>
      ) : (
        <>
          <IconInfo aria-hidden="true" className="size-3.5 shrink-0 text-foreground" />
          <span className="font-medium text-foreground">Not quite. Read the reasons, then try again.</span>
        </>
      )}
    </p>
  );
}

export default function Demo(): React.JSX.Element {
  const [verdict, setVerdict] = useState<boolean | null>(null);
  const [value, setValue] = useState<readonly string[]>(["sender", "greeting"]);
  const [status, setStatus] = useState<QuizStatus>("checked");

  return (
    <div className="grid w-full max-w-4xl gap-x-8 gap-y-10 md:grid-cols-2 md:items-start">
      <Example caption="Try it: choose an answer, press Check answer, then Try again. One answer is right, so the options are radio buttons.">
        <div className="grid gap-3">
          <QuizOptions
            question="A teammate is leaving Northwind. What should you do with their open tasks?"
            options={LEAVER}
            correct="reassign"
            allowRetry
            onCheck={({ correct }) => setVerdict(correct)}
            onRetry={() => setVerdict(null)}
          />
          <Verdict result={verdict} />
        </div>
      </Example>

      <Example caption="Several right answers make checkboxes. Here the question is controlled and already checked: a right choice, a wrong one and two that were missed, each marked in words.">
        <QuizOptions
          question="Which of these are signs of a phishing email?"
          options={PHISHING}
          correct={["sender", "urgency", "link"]}
          value={value}
          onValueChange={setValue}
          status={status}
          onCheck={() => setStatus("checked")}
          onRetry={() => setStatus("answering")}
          allowRetry
        />
      </Example>
    </div>
  );
}
