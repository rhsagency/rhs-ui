"use client";

import { useState } from "react";

import { Button } from "@rhs-ui/primitives/button";
import { Stepper } from "@rhs-ui/primitives/stepper";

const STEPS = [
  { title: "Account", description: "Name and email" },
  { title: "Workspace", description: "Name your team" },
  { title: "Invite", description: "Bring people in" },
  { title: "Done", description: "Start building" },
];

export default function Demo(): React.JSX.Element {
  const [step, setStep] = useState(1);
  return (
    <div className="grid w-full max-w-xl gap-8">
      <Stepper steps={STEPS} current={step} onStepClick={setStep} label="Setting up your workspace" />
      <div className="flex justify-between">
        <Button variant="outline" disabled={step === 0} onClick={() => setStep(step - 1)}>
          Back
        </Button>
        <Button disabled={step === STEPS.length - 1} onClick={() => setStep(step + 1)}>
          Continue
        </Button>
      </div>
      <div className="max-w-56">
        <Stepper steps={STEPS} current={step} orientation="vertical" label="Setting up, as a list" />
      </div>
    </div>
  );
}
