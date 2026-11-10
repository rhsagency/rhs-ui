"use client";

import { useState, type ReactNode } from "react";

import { QuestionNavigator, type NavigatorQuestion } from "@rhs-ui/application/question-navigator";
import { IconArrowLeft, IconArrowRight, IconFlag } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { Label } from "@rhs-ui/primitives/label";
import { RadioGroup, RadioGroupItem } from "@rhs-ui/primitives/radio-group";
import { Toggle } from "@rhs-ui/primitives/toggle";

export default function Demo(): React.JSX.Element {
  const [current, setCurrent] = useState("q7");
  const [answers, setAnswers] = useState<Record<string, string>>(INITIAL_ANSWERS);
  const [flagged, setFlagged] = useState<readonly string[]>(["q4", "q11"]);

  const questions: NavigatorQuestion[] = STATEMENTS.map((_, index) => {
    const id = `q${index + 1}`;
    return { id, label: String(index + 1), state: answers[id] ? "answered" : "unanswered", flagged: flagged.includes(id) };
  });
  const position = Math.max(0, questions.findIndex((question) => question.id === current));
  const move = (to: number) => setCurrent(questions[Math.min(questions.length - 1, Math.max(0, to))]?.id ?? current);

  return (
    <div className="w-full">
      <div className="mx-auto grid max-w-4xl gap-12">
        <Case caption="Beside a survey: choose an answer and its cell gets a dot, flag a question and it gets a flag. Arrow keys move around the grid and Enter jumps. The filter lists only what you ask for.">
          <div className="grid gap-x-8 gap-y-8 rounded-xl border border-border bg-card p-4 text-card-foreground shadow-xs sm:p-6 md:grid-cols-[minmax(0,1fr)_19rem]">
            <section aria-labelledby="qn-question" className="grid min-w-0 content-start gap-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-medium text-muted-foreground tabular-nums">
                  Question {position + 1} of {questions.length}
                </p>
                <Toggle
                  variant="outline"
                  size="sm"
                  pressed={flagged.includes(current)}
                  onPressedChange={(on) => setFlagged((list) => (on ? [...list, current] : list.filter((id) => id !== current)))}
                  aria-label="Flag for review"
                >
                  <IconFlag />
                  Flag for review
                </Toggle>
              </div>
              <h2 id="qn-question" className="text-lg leading-snug font-semibold tracking-[-0.02em] text-balance">
                {STATEMENTS[position]}
              </h2>
              <RadioGroup aria-labelledby="qn-question" value={answers[current] ?? ""} onValueChange={(value) => setAnswers((all) => ({ ...all, [current]: value }))} className="gap-2">
                {SCALE.map((option) => (
                  <Label key={option} className="flex cursor-pointer items-center gap-3 rounded-lg border border-border px-3.5 py-3 font-normal transition-colors motion-reduce:transition-none hover:bg-muted/50 has-data-[state=checked]:border-foreground has-data-[state=checked]:bg-muted/40 has-focus-visible:ring-[3px] has-focus-visible:ring-ring/40">
                    <RadioGroupItem value={option} />
                    {option}
                  </Label>
                ))}
              </RadioGroup>
              <div className="flex items-center justify-between gap-3 pt-1">
                <Button variant="outline" disabled={position === 0} onClick={() => move(position - 1)}>
                  <IconArrowLeft />
                  Previous
                </Button>
                <Button disabled={position === questions.length - 1} onClick={() => move(position + 1)}>
                  Next
                  <IconArrowRight />
                </Button>
              </div>
            </section>
            <QuestionNavigator questions={questions} current={current} onSelect={setCurrent} showFilter labels={{ navigation: "Survey questions" }} className="min-w-0 md:border-s md:border-border md:ps-8" />
          </div>
        </Case>

        <div className="grid gap-x-10 gap-y-10 sm:grid-cols-[20rem_minmax(0,1fr)] sm:items-start">
          <Case caption="Forty questions in a narrow column, up to six across, without the key, showing only those still open.">
            <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
              <QuestionNavigator questions={LONG} current="s14" onSelect={() => undefined} columns={6} showLegend={false} defaultFilter="unanswered" showFilter labels={{ navigation: "Open questions" }} />
            </div>
          </Case>
          <Case caption="Nothing to find: when a filter lists no question the grid says so instead of standing empty.">
            <div className="max-w-sm rounded-xl border border-border bg-card p-4 shadow-xs">
              <QuestionNavigator questions={LONG.map((question) => ({ ...question, state: "answered" as const, flagged: false }))} current="s14" onSelect={() => undefined} columns={6} showLegend={false} defaultFilter="flagged" showFilter labels={{ navigation: "Flagged questions" }} />
            </div>
          </Case>
        </div>
      </div>
    </div>
  );
}

function Case({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 content-start gap-3">
      <p className="text-xs leading-relaxed text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

const SCALE = ["Strongly disagree", "Disagree", "Neither agree nor disagree", "Agree", "Strongly agree"] as const;

const STATEMENTS = [
  "I know what is expected of me at work.",
  "I have the tools I need to do my job well.",
  "In the last week I was recognised for good work.",
  "My manager cares about me as a person.",
  "Someone at work encourages my development.",
  "At work, my opinions seem to count.",
  "The mission of the company makes my job feel important.",
  "My colleagues are committed to doing quality work.",
  "I have a close friend at work.",
  "In the last six months someone talked to me about my progress.",
  "I get to do what I do best every day.",
  "I can switch off from work in my free time.",
  "Changes at the company are explained clearly.",
  "I trust the people who lead the company.",
  "The meetings at our company are worth my time.",
  "I would recommend working here to a friend.",
  "My workload is manageable.",
  "I feel safe raising a concern.",
  "I see myself working here in two years.",
  "Overall, I am happy with my job.",
] as const;

/** Fourteen of the twenty answered, as in "Answered 14 of 20". */
const INITIAL_ANSWERS: Record<string, string> = Object.fromEntries(
  [1, 2, 3, 4, 5, 6, 8, 9, 10, 12, 13, 15, 16, 18].map((number, index) => [`q${number}`, SCALE[(index * 2 + 1) % SCALE.length] ?? SCALE[3]]),
);

const LONG: readonly NavigatorQuestion[] = Array.from({ length: 40 }, (_, index) => ({
  id: `s${index + 1}`,
  label: String(index + 1),
  state: index < 22 || index % 4 === 0 ? ("answered" as const) : ("unanswered" as const),
  flagged: index === 17 || index === 29,
}));
