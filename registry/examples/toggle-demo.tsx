"use client";

import { useState } from "react";

import { IconBold, IconItalic, IconStar } from "@rhs-ui/icons";
import { Toggle } from "@rhs-ui/primitives/toggle";

export default function Demo(): React.JSX.Element {
  const [starred, setStarred] = useState(false);
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-2">
        <Toggle aria-label="Bold">
          <IconBold />
        </Toggle>
        <Toggle aria-label="Italic" variant="outline">
          <IconItalic />
        </Toggle>
        <Toggle variant="outline" pressed={starred} onPressedChange={setStarred}>
          <IconStar /> {starred ? "Starred" : "Star"}
        </Toggle>
      </div>
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {starred ? "Added to your starred projects." : "Not starred."}
      </p>
    </div>
  );
}
