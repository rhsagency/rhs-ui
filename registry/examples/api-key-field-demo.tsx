"use client";

import { useState } from "react";

import { ApiKeyField } from "@rhs-ui/application/api-key-field";

export default function Demo(): React.JSX.Element {
  const [key, setKey] = useState("demo_key_4f2a91c07be3d58e");
  return (
    <div className="mx-auto max-w-lg p-6">
      <ApiKeyField
        label="Production secret key"
        value={key}
        meta="Last used 2 hours ago"
        onRotate={() => new Promise<void>((resolve) => setTimeout(() => { setKey(`demo_key_${Math.random().toString(16).slice(2, 18)}`); resolve(); }, 600))}
      />
    </div>
  );
}
