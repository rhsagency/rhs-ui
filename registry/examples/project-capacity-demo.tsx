import type { ReactNode } from "react";

import { ProjectCapacity } from "@rhs-ui/marketing/project-capacity";

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="min-w-0">
      <p className="mb-6 text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10 sm:py-16">
      <Example caption="Four months: a filled dot is a booked place, an outlined one is open, and the words say the same. A full month stays visible with a link to the waiting list">
        <ProjectCapacity
          title="Where we have room"
          description="We take on three projects a month, so each one gets the whole team. Here is what is still open."
          months={[
            { label: "November", total: 3, taken: 2 },
            { label: "December", total: 3, taken: 3 },
            { label: "January", total: 3, taken: 1 },
            { label: "February", total: 3, taken: 0 },
          ]}
          action={{ label: "Reserve a slot", href: "#reserve" }}
          waitlistHref="#waitlist"
          note="A slot is confirmed after a short intro call. Nothing is charged until then."
        />
      </Example>
      <div className="mt-16 border-t border-border pt-12">
        <Example caption="Six months with eight places each: the tiles share the width, and a booked place is never told by colour alone">
          <ProjectCapacity
            headingLevel={3}
            title="Coaching intake, autumn to spring"
            months={[
              { label: "November", total: 8, taken: 8 },
              { label: "December", total: 8, taken: 6 },
              { label: "January 2027", total: 8, taken: 3 },
              { label: "February", total: 8, taken: 1 },
              { label: "March", total: 8, taken: 0 },
              { label: "April", total: 8, taken: 0 },
            ]}
            action={{ label: "Reserve a slot", href: "#reserve" }}
            waitlistHref="#waitlist"
          />
        </Example>
      </div>
      <div className="mt-16 max-w-md border-t border-border pt-12">
        <Example caption="In a narrow column, with every month taken: the tiles become rows and the button becomes the waiting list">
          <ProjectCapacity
            headingLevel={3}
            title="Fully booked"
            months={[
              { label: "November", total: 3, taken: 3 },
              { label: "December", total: 3, taken: 3 },
              { label: "January", total: 3, taken: 3 },
            ]}
            action={{ label: "Reserve a slot", href: "#reserve" }}
            waitlistHref="#waitlist"
            note="You will hear from us the day a place opens."
          />
        </Example>
      </div>
    </div>
  );
}
