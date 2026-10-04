"use client";

import { useState } from "react";

import { KeyValueEditor, type KeyValuePair } from "@rhs-ui/primitives/key-value-editor";

export default function Demo(): React.JSX.Element {
  const [pairs, setPairs] = useState<KeyValuePair[]>([
    { id: "1", key: "API_URL", value: "https://api.example.com" },
    { id: "2", key: "API_KEY", value: "sk_test_placeholder_value", secret: true },
    { id: "3", key: "api-region", value: "eu-west" },
  ]);
  return (
    <div className="mx-auto max-w-xl p-8">
      <p className="mb-3 text-sm font-medium">Environment variables</p>
      <KeyValueEditor pairs={pairs} onPairsChange={setPairs} keyPattern={/^[A-Z][A-Z0-9_]*$/} />
    </div>
  );
}
