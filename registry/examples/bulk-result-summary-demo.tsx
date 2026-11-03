"use client";

import { useState, type ReactNode } from "react";

import { BulkResultSummary, type BulkFailure } from "@rhs-ui/application/bulk-result-summary";
import { Button } from "@rhs-ui/primitives/button";

const FAILURES: readonly BulkFailure[] = [
  { id: "row-17", label: "Row 17", reason: "email is not valid" },
  { id: "row-23", label: "Row 23", reason: "phone number is missing a country code" },
  { id: "row-31", label: "Row 31", reason: "email is not valid" },
  { id: "row-44", label: "Row 44", reason: "company name is longer than 80 characters" },
  { id: "row-52", label: "Row 52", reason: "owner mara@northwind.example is not on your team" },
  { id: "row-58", label: "Row 58", reason: "email is not valid" },
  { id: "row-71", label: "Row 71", reason: "postcode does not match the country" },
  { id: "row-96", label: "Row 96", reason: "phone number is missing a country code" },
  { id: "row-118", label: "Row 118", reason: "the tag “vip” does not exist" },
];

const NOUN = { one: "contact", other: "contacts" } as const;

function Case({ caption, children }: { caption: ReactNode; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

/** An import that can be retried: the retry fixes five of the nine, and the panel takes the new numbers. */
function Import(): React.JSX.Element {
  const [round, setRound] = useState(0);
  const [retried, setRetried] = useState(false);
  const [log, setLog] = useState("");

  return (
    <div className="grid gap-4">
      <BulkResultSummary
        key={round}
        // A panel that answers an import the person just ran takes the focus once. The one on first load is an example on a page, so it leaves the focus alone.
        autoFocus={round > 0}
        total={124}
        succeeded={retried ? 114 : 109}
        skipped={6}
        failures={retried ? FAILURES.slice(0, 4) : FAILURES}
        noun={NOUN}
        verb="Imported"
        onRetryFailed={async () => {
          await wait(1300);
          setRetried(true);
          setLog("Retried: five of the nine went through, and the panel took the new numbers.");
        }}
        onDownloadReport={async () => {
          await wait(900);
          setLog("The report was downloaded (simulated).");
        }}
      />
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => {
            setRetried(false);
            setLog("The import ran again: the panel appeared and took the focus once.");
            setRound((count) => count + 1);
          }}
        >
          Run the import again
        </Button>
        <p className="text-xs text-muted-foreground" aria-live="polite">
          {log}
        </p>
      </div>
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-xl gap-10">
      <Case caption="Some failed: the headline, a bar told apart by pattern with every count written out, and the failures with their reasons. Beyond five they fold. Retry and the report are the way on.">
        <Import />
      </Case>

      <Case caption="Nothing failed, some were skipped: the panel shrinks to one calm line.">
        <BulkResultSummary autoFocus={false} total={124} succeeded={118} skipped={6} noun={NOUN} verb="Imported" onDownloadReport={() => undefined} />
      </Case>

      <Case caption="Everything worked.">
        <BulkResultSummary autoFocus={false} total={52} succeeded={52} noun={{ one: "photo", other: "photos" }} verb="Resized" />
      </Case>

      <Case caption="A few failures show in full, with no fold. Three counts, and a fourth when the job was stopped before it reached everything.">
        <BulkResultSummary
          autoFocus={false}
          total={300}
          succeeded={212}
          failures={FAILURES.slice(0, 3)}
          noun="orders"
          verb="Archived"
          onRetryFailed={() => undefined}
        />
      </Case>
    </div>
  );
}
