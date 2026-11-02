import type { ReactNode } from "react";

import { GoodFitSection } from "@rhs-ui/marketing/good-fit-section";

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
      <Example caption="Two honest lists on one surface: who it suits, with the action, and who it does not, with what to use instead">
        <GoodFitSection
          align="center"
          eyebrow="Is it for you?"
          title="Who Kestrel is for, and who it is not"
          description="We would rather you know in two minutes than find out in two weeks."
          fit={[
            "Your team is between 5 and 200 people",
            "Work passes through three or more people before it is done",
            "You want to see who owns what without having to ask",
            "Decisions currently live in email and chat threads",
            "You plan in weeks and quarters, not in minutes",
          ]}
          notFit={[
            "You work on your own: a spreadsheet will do",
            "You bill by the minute and need detailed timesheets",
            "You run hundreds of linked projects with strict dependencies",
            "Your company cannot use a cloud service",
          ]}
          alternative={{ text: "For one-person shops, a spreadsheet is enough. Here is ours, free.", href: "#spreadsheet" }}
          cta={{ label: "Start your free trial", href: "#trial" }}
        />
      </Example>
      <div className="mx-auto mt-20 max-w-xl border-t border-border pt-12 sm:mt-24">
        <Example caption="In a narrow column the two lists stack, good fit first, each under its own heading">
          <GoodFitSection
            headingLevel={3}
            title="Is a retainer right for you?"
            fit={[
              "You will have design and development work every month",
              "One person on your side can decide quickly",
              "You would rather brief once than quote each job",
              "You want the same two people on it, every month",
            ]}
            notFit={[
              "You have a single launch to get out",
              "You need a fixed price before we have talked",
              "Your work comes in bursts, a few times a year",
              "You want to run the project day to day yourself",
            ]}
            alternative={{ text: "For a single launch, a fixed-price project is the better start.", href: "#project" }}
            cta={{ label: "Plan a retainer", href: "#retainer" }}
          />
        </Example>
      </div>
    </div>
  );
}
