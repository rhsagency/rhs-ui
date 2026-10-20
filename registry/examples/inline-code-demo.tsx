import type { ReactNode } from "react";

import { Callout } from "@rhs-ui/primitives/callout";
import { InlineCode } from "@rhs-ui/primitives/inline-code";

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-2xl gap-10">
      <Example caption="In running text it stays quiet and legible">
        <p className="text-[0.9375rem] leading-7">
          Add the button with <InlineCode>pnpm dlx shadcn@latest add https://rhsui.com/r/button.json</InlineCode>, then import <InlineCode>Button</InlineCode> from{" "}
          <InlineCode>@/components/rhs-ui/primitives/button</InlineCode>. Pass <InlineCode>asChild</InlineCode> to render a link and <InlineCode>loading</InlineCode> to show a spinner while a request runs.
        </p>
      </Example>

      <Example caption="Copyable: the chip is a button, and a check confirms the copy">
        <p className="text-[0.9375rem] leading-7">
          Start the dev server with <InlineCode copyable>pnpm dev</InlineCode> and open <InlineCode copyable>http://localhost:3000</InlineCode>. Your project key is{" "}
          <InlineCode copyable>kst_live_7Hq2xN9v</InlineCode>; keep it out of the repo.
        </p>
      </Example>

      <Example caption="It inherits the size of its surroundings">
        <div className="grid gap-5 rounded-xl border border-border bg-card p-5 shadow-xs">
          <h2 className="text-2xl font-semibold tracking-[-0.03em]">
            Use <InlineCode>useAutoplay</InlineCode> for carousels
          </h2>
          <dl className="grid grid-cols-[auto_1fr] items-baseline gap-x-5 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Install</dt>
            <dd>
              <InlineCode>npm i @northwind/ui</InlineCode>
            </dd>
            <dt className="text-muted-foreground">Import</dt>
            <dd>
              <InlineCode>{"import { Button } from \"@northwind/ui\""}</InlineCode>
            </dd>
          </dl>
          <Callout tone="tip" title="Set a stable id">
            Give each item a stable <InlineCode size="sm">id</InlineCode> instead of its index, so reordering never remounts it.
          </Callout>
        </div>
      </Example>

      <Example caption="Long strings break at slashes, dots and underscores">
        <div className="w-60 max-w-full rounded-xl border border-border bg-card p-4 text-sm leading-7 shadow-xs">
          Edit <InlineCode>src/components/rhs-ui/primitives/paste_button.test.tsx</InlineCode> and run the suite again.
        </div>
      </Example>
    </div>
  );
}
