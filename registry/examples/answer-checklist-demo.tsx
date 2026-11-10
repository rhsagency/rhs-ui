"use client";

import { useState, type ReactNode } from "react";

import { AnswerChecklist, type ChecklistItem, type ChecklistOption, type ChecklistValue } from "@rhs-ui/application/answer-checklist";

/** A caption and the example under it. */
function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-1 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

const FIRE: readonly ChecklistItem[] = [
  { id: "exits", label: "Fire exits are clear and signposted", hint: "Walk the route from each floor to the assembly point." },
  { id: "extinguishers", label: "Extinguishers are in place and in date", hint: "The service tag must show this year." },
  { id: "lighting", label: "Emergency lighting works", hint: "Hold the test button for ten seconds.", notePlaceholder: "Which fittings failed, and where?" },
  { id: "callpoints", label: "Alarm call points are unobstructed" },
  { id: "stairs", label: "Escape stairs are free of storage", hint: "Nothing on the landings or in the stairwell.", notePlaceholder: "What is in the way, and who has been told?" },
  { id: "doors", label: "Fire doors close fully on their own", hint: "Open each door halfway and let go." },
  { id: "sprinklers", label: "Sprinkler heads are clear and unpainted" },
  { id: "plan", label: "The evacuation plan is posted by every lift" },
];

const INTAKE: readonly ChecklistItem[] = [
  { id: "medication", label: "Are you taking any medication?", hint: "Include supplements and anything bought over the counter.", notePlaceholder: "Which medication, and how often?" },
  { id: "allergies", label: "Do you have any allergies?", notePlaceholder: "What are you allergic to, and what happens?" },
  { id: "surgery", label: "Have you had surgery in the last twelve months?", notePlaceholder: "What was done, and when?" },
  { id: "specialist", label: "Are you under the care of a specialist?", notePlaceholder: "Which specialist, and for what?" },
];

const YES_NO: readonly ChecklistOption[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

export default function Demo(): React.JSX.Element {
  const [fire, setFire] = useState<ChecklistValue>({
    exits: { answer: "pass" },
    extinguishers: { answer: "pass" },
    lighting: { answer: "fail", note: "" },
    callpoints: { answer: "pass" },
    stairs: { answer: "fail", note: "Two pallets of printer paper on the level 2 landing. Facilities will move them today." },
    doors: { answer: "na" },
  });
  const [intake, setIntake] = useState<ChecklistValue>({
    medication: { answer: "yes", note: "Levothyroxine, 75 mcg every morning." },
    allergies: { answer: "no" },
  });

  return (
    <div className="grid w-full max-w-3xl grid-cols-1 gap-10">
      <Example caption="Try it: Fail asks for a note, and the row stays open until it has one. The header counts what is left, and Jump to next unanswered moves focus to the first open row.">
        <AnswerChecklist items={FIRE} value={fire} onValueChange={setFire} noteOn={["fail"]} />
      </Example>

      <Example caption="The same list with Yes and No: any set of answers works, and the notes are asked for only on Yes.">
        <AnswerChecklist items={INTAKE} options={YES_NO} value={intake} onValueChange={setIntake} noteOn={["yes"]} />
      </Example>
    </div>
  );
}
