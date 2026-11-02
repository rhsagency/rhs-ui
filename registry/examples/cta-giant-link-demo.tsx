import type { ReactNode } from "react";

import { CtaGiantLink } from "@rhs-ui/marketing/cta-giant-link";

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="min-w-0">
      <p className="mb-8 text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10 sm:py-16">
      <Example caption="Hover or tab to the line: the colour softens and the arrow moves, nothing else. Under it, the address with a copy button, the reply time and the next free slot">
        <CtaGiantLink label="Let’s work together" href="#contact" email="hello@halcyon.studio" note="Within one working day" availability="Monday 3 November" />
      </Example>
      <div className="mt-20 max-w-sm border-t border-border pt-10 sm:mt-24">
        <Example caption="In a narrow column the type scales down with it and still breaks only between words">
          <CtaGiantLink headingLevel={3} label="Start a project with us" href="#project" email="studio@halcyon.studio" />
        </Example>
      </div>
    </div>
  );
}
