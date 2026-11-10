"use client";

import { useRef, useState, type ReactNode } from "react";

import { Badge } from "@rhs-ui/primitives/badge";
import { Label } from "@rhs-ui/primitives/label";
import { StagePath, type PathStage } from "@rhs-ui/primitives/stage-path";
import { Switch } from "@rhs-ui/primitives/switch";

const DEAL: readonly PathStage[] = [
  { id: "lead", label: "Lead", note: "Came in through the pricing page" },
  { id: "qualified", label: "Qualified", note: "Budget confirmed by finance" },
  { id: "proposal", label: "Proposal", note: "Waiting on legal sign-off" },
  { id: "negotiation", label: "Negotiation", note: "Discount is capped at 10%" },
  { id: "won", label: "Won", note: "Contract signed" },
];

const HIRING: readonly PathStage[] = [
  { id: "applied", label: "Applied", date: "3 Nov" },
  { id: "screen", label: "Screen", date: "5 Nov" },
  { id: "interview", label: "Interview", date: "11 Nov" },
  { id: "offer", label: "Offer", date: "Due 18 Nov" },
  { id: "hired", label: "Hired" },
];

const ORDER: readonly PathStage[] = [
  { id: "placed", label: "Placed" },
  { id: "packed", label: "Packed" },
  { id: "shipped", label: "Shipped" },
  { id: "delivered", label: "Delivered" },
];

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <section className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </section>
  );
}

function Deal(): React.JSX.Element {
  const [current, setCurrent] = useState<string | null>("proposal");
  const [lost, setLost] = useState(false);
  const [back, setBack] = useState(false);
  const [saved, setSaved] = useState("Nothing changed yet");
  const timer = useRef<number | undefined>(undefined);

  /** Pretends to save: the path shows the stage as busy until the answer comes, then you decide what `current` becomes. */
  function change(id: string): Promise<void> {
    return new Promise((resolve) => {
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => {
        if (id === "lost") {
          setLost(true);
          setSaved("Saved: the deal is closed lost");
        } else {
          setLost(false);
          setCurrent(id);
          setSaved(`Saved: moved to ${DEAL.find((stage) => stage.id === id)?.label ?? id}`);
        }
        resolve();
      }, 700);
    });
  }

  const status = lost ? "Closed lost" : current === "won" ? "Won" : "Open";
  return (
    <div className="grid gap-5 rounded-xl border border-border bg-card p-4 shadow-xs sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="grid min-w-0 gap-0.5">
          <h2 className="truncate text-base font-semibold tracking-[-0.02em]">Halcyon Studio, annual plan</h2>
          <p className="text-sm text-muted-foreground">Owner Mara Okafor, €48,000 a year</p>
        </div>
        <Badge variant={lost ? "destructive" : "outline"}>{status}</Badge>
      </div>
      <StagePath label="Deal stage" stages={DEAL} current={current} lost={lost} lostLabel="Closed lost" allowBackward={back} onStageChange={change} />
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-border pt-4">
        <div className="flex items-center gap-2.5">
          <Switch id="stage-path-back" checked={back} onCheckedChange={setBack} />
          <Label htmlFor="stage-path-back" className="font-normal text-muted-foreground">
            Allow moving back
          </Label>
        </div>
        <p role="status" className="text-xs text-muted-foreground">
          {saved}
        </p>
      </div>
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-3xl gap-10">
      <Example caption="Press a stage to move the deal. The path asks your callback first and shows the stage busy while it saves.">
        <Deal />
      </Example>
      <Example caption="Large, read-only, with dates: a hiring pipeline.">
        <StagePath label="Candidate stage" size="lg" stages={HIRING} current="interview" />
      </Example>
      <Example caption="Small, and finished: the last stage is filled and checked.">
        <StagePath label="Order status" size="sm" stages={ORDER} current="delivered" />
      </Example>
      <Example caption="Read-only, lost after the proposal: the stages it reached keep their check.">
        <StagePath label="Lost deal stage" stages={DEAL} current="proposal" lost lostLabel="Closed lost" />
      </Example>
    </div>
  );
}
