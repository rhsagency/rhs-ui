"use client";

import { useState } from "react";

import { Button } from "@rhs-ui/primitives/button";
import { RateLimitNotice } from "@rhs-ui/primitives/rate-limit-notice";

export default function Demo(): React.JSX.Element {
  const [ready, setReady] = useState(false);
  return (
    <div className="mx-auto grid max-w-md gap-3 p-8">
      <RateLimitNotice retryAfter={20} what="requesting sign-in codes" onReady={() => setReady(true)} action={<>Need more exports a day? <a href="#plans">See the Team plan</a>.</>} />
      <Button disabled={!ready} className="justify-self-start">Send a new code</Button>
    </div>
  );
}
