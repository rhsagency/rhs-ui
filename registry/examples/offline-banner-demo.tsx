"use client";

import { useState } from "react";

import { Button } from "@rhs-ui/primitives/button";
import { OfflineBanner } from "@rhs-ui/primitives/offline-banner";

export default function Demo(): React.JSX.Element {
  const [online, setOnline] = useState(false);
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4 p-8">
      <OfflineBanner online={online} />
      <Button variant="outline" className="self-center" onClick={() => setOnline((value) => !value)}>
        {online ? "Go offline" : "Come back online"}
      </Button>
    </div>
  );
}
