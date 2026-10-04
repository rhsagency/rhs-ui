"use client";

import { useState } from "react";

import { VersionSelect } from "@rhs-ui/primitives/version-select";

export default function Demo(): React.JSX.Element {
  const [version, setVersion] = useState("2.4");
  return (
    <div className="flex min-h-40 items-start justify-center p-6">
      <VersionSelect
        value={version}
        onValueChange={setVersion}
        versions={[
          { value: "3.0", label: "v3.0-beta", note: "Unreleased" },
          { value: "2.4", label: "v2.4", note: "Sep 2026", latest: true },
          { value: "2.3", label: "v2.3", note: "Jun 2026" },
          { value: "1.9", label: "v1.9", note: "Legacy" },
        ]}
      />
    </div>
  );
}
