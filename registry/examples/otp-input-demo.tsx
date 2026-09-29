"use client";

import { useState } from "react";

import { OtpInput } from "@rhs-ui/primitives/otp-input";

export default function Demo(): React.JSX.Element {
  const [status, setStatus] = useState("Enter the six digits from your email.");
  return (
    <div className="flex flex-col items-center gap-4">
      <OtpInput groupAfter={3} onComplete={(code) => setStatus(code === "123456" ? "Signed in." : `Checking ${code}. Try 123456 in this preview.`)} />
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {status}
      </p>
    </div>
  );
}
