"use client";

import { useState, type ReactNode } from "react";

import { UtmBuilder, type UtmValue } from "@rhs-ui/application/utm-builder";

/** A caption above a case, in the quiet voice the rest of the demo uses. */
function Case({ caption, children }: { caption: ReactNode; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 content-start gap-3">
      <p className="text-xs leading-relaxed text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const [value, setValue] = useState<UtmValue>({
    url: "https://northwind.example/spring-sale?ref=partner#compare",
    source: "Newsletter",
    medium: "email",
    campaign: "spring-sale",
    term: "",
    content: "header-button",
  });

  return (
    <div className="@container w-full">
      <div className="mx-auto grid max-w-2xl gap-12">
        <Case caption="The page already has a ref parameter and a #compare section: both are kept, and the tags are encoded. Newsletter with a capital gets a quiet warning and a one-click fix.">
          <UtmBuilder value={value} onValueChange={setValue} />
        </Case>

        <Case caption="The page is known, so its address is locked. The term is required here, and these campaign names are the ones the team already uses. Until every required tag has a value, the result says what is still needed.">
          <UtmBuilder baseUrl="https://northwind.example/pricing" requireTerm suggestions={{ campaign: ["spring-sale", "black-friday", "launch-week"] }} />
        </Case>
      </div>
    </div>
  );
}
