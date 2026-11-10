"use client";

import { useState } from "react";

import { AnswersReview, type AnswerGroup } from "@rhs-ui/application/answers-review";
import { Button } from "@rhs-ui/primitives/button";

const GROUPS: AnswerGroup[] = [
  {
    title: "About you",
    rows: [
      { key: "name", label: "Full name", value: "Mara Jansen" },
      { key: "birth", label: "Date of birth", value: "14 March 1991" },
      { key: "email", label: "Email address", value: "mara.jansen@kestrel", error: "Enter an email address in the correct format, like name@example.com." },
      { key: "phone", label: "Phone number" },
    ],
  },
  {
    title: "Where you live",
    rows: [
      { key: "address", label: "Home address", value: "Prinsengracht 267 A\n1016 GV Amsterdam\nThe Netherlands" },
      { key: "since", label: "Living there since", value: "June 2023" },
    ],
  },
  {
    title: "Your documents",
    rows: [
      { key: "proof", label: "Proof of address", files: ["utility-bill-march-2026.pdf", "bank-statement-march-2026-with-a-name-that-keeps-on-going-and-going.pdf"], href: "#documents" },
      { key: "id", label: "Identity document", files: [] },
    ],
  },
  {
    title: "Your application",
    rows: [
      {
        key: "reason",
        label: "Why you are applying",
        value:
          "I run a small ceramics studio from the ground floor of our house, and the neighbours already know the sound of the kiln. A permit for the cargo bike and the delivery van would let me collect clay and ship orders without blocking the street.",
      },
      { key: "vehicle", label: "Vehicle", value: "Cargo bike with trailer" },
    ],
  },
];

export default function Demo(): React.JSX.Element {
  const [status, setStatus] = useState("Press Change on any answer: you go back to that question.");

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
      <header className="mb-8 grid gap-1.5">
        <h2 className="text-2xl font-semibold tracking-[-0.03em]">Check your answers</h2>
        <p className="text-sm text-muted-foreground">Look through what you filled in before you send your parking permit application to the municipality of Amsterdam.</p>
      </header>

      <AnswersReview
        groups={GROUPS}
        headingLevel={3}
        onChange={(key) => {
          const label = GROUPS.flatMap((group) => group.rows).find((row) => row.key === key)?.label ?? key;
          setStatus(`Back to the question: ${label}.`);
        }}
      />

      <div className="mt-8 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <p role="status" className="min-w-0 flex-1 basis-56 text-sm text-muted-foreground">
          {status}
        </p>
        <Button type="button" onClick={() => setStatus("Fix the email address first: it is marked above.")}>
          Send application
        </Button>
      </div>
    </div>
  );
}
