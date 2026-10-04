"use client";

import { useState } from "react";

import { Button } from "@rhs-ui/primitives/button";
import { ConsentCheckboxes, consentComplete, type ConsentItem } from "@rhs-ui/primitives/consent-checkboxes";

const ITEMS: ConsentItem[] = [
  { id: "terms", required: true, label: <>I agree to the <a href="#terms">terms of service</a> and have read the <a href="#privacy">privacy policy</a>.</> },
  { id: "news", label: "Send me the monthly product newsletter." },
  { id: "research", label: "You may invite me to research interviews, at most twice a year." },
];

export default function Demo(): React.JSX.Element {
  const [value, setValue] = useState<string[]>([]);
  const [tried, setTried] = useState(false);
  const [done, setDone] = useState(false);
  return (
    <form className="mx-auto grid max-w-md gap-4 p-8" onSubmit={(event) => { event.preventDefault(); setTried(true); setDone(consentComplete(ITEMS, value)); }}>
      <ConsentCheckboxes items={ITEMS} value={value} onValueChange={setValue} showErrors={tried} />
      <Button type="submit" className="justify-self-start">Create account</Button>
      <p role="status" className="text-sm text-muted-foreground">{done ? "Account created." : ""}</p>
    </form>
  );
}
