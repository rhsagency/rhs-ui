"use client";
import { useState } from "react";
import { StepProgress } from "@rhs-ui/application/step-progress";
import { Button } from "@rhs-ui/primitives/button";
export default function StepProgressDemo(): React.JSX.Element {
  const [step, setStep] = useState(0);
  return <div className="flex w-full max-w-xl flex-col gap-10 p-6"><StepProgress steps={["Details", "Delivery", "Review"]} current={step} /><div className="flex justify-end gap-3"><Button variant="outline" disabled={step === 0} onClick={() => setStep(step - 1)}>Back</Button><Button onClick={() => setStep(step === 3 ? 0 : step + 1)}>{step === 3 ? "Start again" : "Continue"}</Button></div></div>;
}
