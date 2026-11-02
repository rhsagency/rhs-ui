"use client";

import { useState, type ReactNode } from "react";

import { StepSlider, type Step } from "@rhs-ui/primitives/step-slider";

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-1 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

const card = "grid gap-5 rounded-xl border border-border bg-card p-5 shadow-xs";

const BACKUPS: readonly Step[] = [
  { value: "weekly", label: "Weekly", description: "A full copy every Sunday at 02:00, kept for 8 weeks." },
  { value: "monthly", label: "Monthly", description: "A full copy on the 1st of each month, kept for 12 months." },
  { value: "yearly", label: "Yearly", description: "One full copy on 1 January, kept for 7 years for the audit." },
];

const TEXT: readonly (Step & { size: string })[] = [
  { value: "small", label: "Small", size: "0.8125rem", description: "13 px: more on screen, for people who know the app well." },
  { value: "default", label: "Default", size: "0.9375rem", description: "15 px: how Halcyon is designed to read." },
  { value: "large", label: "Large", size: "1.0625rem", description: "17 px: comfortable on a tablet at arm's length." },
  { value: "larger", label: "Larger", size: "1.1875rem", description: "19 px: for long reading sessions." },
  { value: "largest", label: "Largest", size: "1.375rem", description: "22 px: the biggest the layout stays tidy at." },
];

const DELIVERY: readonly Step[] = [
  { value: "economy", label: "Economy", description: "5 to 7 working days. Free over 50 euros." },
  { value: "standard", label: "Standard", description: "2 to 3 working days. 3.95 euros." },
  { value: "express", label: "Express", description: "Next working day by 12:00. 8.95 euros." },
  { value: "same-day", label: "Same day", description: "Today, if you order before 14:00. 14.95 euros." },
];

export default function Demo(): React.JSX.Element {
  const [backup, setBackup] = useState("monthly");
  const [text, setText] = useState("default");
  const [delivery, setDelivery] = useState("standard");
  const size = TEXT.find((step) => step.value === text)?.size ?? "0.9375rem";
  return (
    <div className="grid w-full max-w-4xl grid-cols-1 gap-x-10 gap-y-9 md:grid-cols-2 md:items-start">
      <div className="grid min-w-0 content-start gap-9">
        <Example caption="Try it: the arrow keys move one stop, Home and End jump to the ends, and a label chooses its stop">
          <div className={card}>
            <StepSlider label="Backup frequency" steps={BACKUPS} value={backup} onValueChange={setBackup} name="backup" />
          </div>
        </Example>
        <Example caption="Four stops, and the choice shows in the page">
          <div className={card}>
            <StepSlider label="Delivery speed" steps={DELIVERY} value={delivery} onValueChange={setDelivery} />
          </div>
        </Example>
      </div>

      <div className="grid min-w-0 content-start gap-9">
        <Example caption="Text size: the sample follows the knob">
          <div className={card}>
            <StepSlider label="Text size" steps={TEXT} value={text} onValueChange={setText} />
            <p className="rounded-lg bg-muted/60 p-4 leading-snug transition-[font-size] duration-150 motion-reduce:transition-none" style={{ fontSize: size }}>
              Halcyon keeps your notes where you left them, on every device.
            </p>
          </div>
        </Example>
        <Example caption="In a narrow panel (18rem) every other label steps aside, and the chosen one stays">
          <div className="max-w-[18rem]">
            <StepSlider label="Text size" steps={TEXT} defaultValue="largest" />
          </div>
        </Example>
        <Example caption="Without labels under the ticks, the chosen one is written beside the heading. And disabled.">
          <div className={card}>
            <StepSlider label="Sync" showLabels={false} steps={[{ value: "off", label: "Manual" }, { value: "hourly", label: "Hourly" }, { value: "live", label: "Live" }]} defaultValue="hourly" />
            <StepSlider disabled label="Plan tier" steps={[{ value: "free", label: "Free" }, { value: "team", label: "Team" }, { value: "business", label: "Business" }]} defaultValue="team" />
          </div>
        </Example>
      </div>
    </div>
  );
}
