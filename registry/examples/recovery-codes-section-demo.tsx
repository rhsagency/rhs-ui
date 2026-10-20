"use client";

import { useState } from "react";

import { RecoveryCodesSection, type RecoveryCode } from "@rhs-ui/application/recovery-codes-section";

const FRESH = ["7KQ4-M9XP", "B2VD-8HTR", "Y6NC-3WJF", "X9LA-5ZEG", "D4SM-R7UK", "H8PT-2QCN", "W3JB-6XYV", "F5GR-9DLM", "N7EZ-4TAH", "C2KU-8VSP"];

const IN_USE: RecoveryCode[] = [
  { code: "R4TG-7JCW", used: true },
  { code: "M9DX-2BKQ", used: true },
  { code: "P6HV-5SNE" },
  { code: "L3ZA-8YUF" },
  { code: "G7QB-4WTD", used: true },
  { code: "K2FN-9RXM" },
  { code: "T8CE-3LHJ" },
  { code: "V5UP-6ADY", used: true },
  { code: "E4MS-7GZB" },
  { code: "J9WR-2NQK" },
];

// Letters and digits without the ones that look alike (0 and O, 1 and I).
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const piece = () => Array.from({ length: 4 }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join("");
const freshSet = () => Array.from({ length: 10 }, () => `${piece()}-${piece()}`);

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function Caption({ children }: { children: string }): React.JSX.Element {
  return <p className="mb-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">{children}</p>;
}

export default function Demo(): React.JSX.Element {
  const [existing, setExisting] = useState<readonly (string | RecoveryCode)[]>(IN_USE);
  const [continued, setContinued] = useState(false);
  return (
    <div className="mx-auto w-full max-w-xl space-y-14 px-4 py-12 sm:px-6">
      <div>
        <Caption>Right after two-step sign-in is set up</Caption>
        <RecoveryCodesSection codes={FRESH} onContinue={() => setContinued(true)} />
        <p role="status" className="mt-3 min-h-5 text-sm text-muted-foreground">
          {continued ? "Continue pressed: on to the account." : ""}
        </p>
      </div>
      <div>
        <Caption>In account settings, some codes spent</Caption>
        <RecoveryCodesSection
          codes={existing}
          onRegenerate={async () => {
            await wait(600);
            setExisting(freshSet());
          }}
        />
      </div>
    </div>
  );
}
