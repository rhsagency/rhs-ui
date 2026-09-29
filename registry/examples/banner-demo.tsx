"use client";

import { useState } from "react";

import { IconSparkle, IconWarning } from "@rhs-ui/icons";
import { Banner } from "@rhs-ui/primitives/banner";
import { Button } from "@rhs-ui/primitives/button";

export default function Demo(): React.JSX.Element {
  const [key, setKey] = useState(0);
  return (
    <div className="grid w-full gap-4">
      <div className="overflow-hidden rounded-lg border border-border">
        <Banner key={key} leading={<IconSparkle />} action={<a href="#release">Read the release notes</a>} onDismiss={() => undefined}>
          RHS UI 0.5 is out, with scroll-driven motion and new backgrounds.
        </Banner>
        <div className="h-24 bg-background" />
      </div>
      <div className="overflow-hidden rounded-lg border border-border">
        <Banner tone="default" leading={<IconWarning />}>
          Checkout is read-only on Sunday between 02:00 and 03:00 CET.
        </Banner>
        <div className="h-16 bg-background" />
      </div>
      <Button variant="ghost" size="sm" className="justify-self-start" onClick={() => setKey(key + 1)}>
        Bring the dismissed banner back
      </Button>
    </div>
  );
}
