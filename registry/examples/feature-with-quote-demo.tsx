import type { ReactNode } from "react";

import { FeatureWithQuote } from "@rhs-ui/marketing/feature-with-quote";

/** A drawn portrait, so the demo needs no files. In a real page this is a photo of the person. */
const portrait = "data:image/svg+xml;utf8," +
  encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96'><rect width='96' height='96' fill='#e4e4e4'/><path d='M12 96c0-21 16-34 36-34s36 13 36 34z' fill='#3b3b3b'/><rect x='41' y='50' width='14' height='16' rx='6' fill='#a8a8a8'/><circle cx='48' cy='38' r='16' fill='#c4c4c4'/><path d='M31 37c-2-13 7-22 18-22 11 0 18 8 16 21-5-2-10-7-12-12-4 6-12 11-22 13z' fill='#1f1f1f'/></svg>",
  );

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
      <Example caption="The feature on the left, the customer who proves it on the right: the quote is a blockquote, and the result stands outside it as a fact">
        <FeatureWithQuote
          feature={{
            eyebrow: "Shared inboxes",
            title: "One inbox for every customer conversation",
            description: "Every email, chat and form lands in one place with a single owner on each thread. Nobody answers twice, and nothing waits because everyone thought someone else had it.",
            points: ["One owner per conversation, always visible", "Reply from the thread, with the customer's history beside it", "Hand over mid-conversation with a private note"],
            href: "#shared-inboxes",
            linkLabel: "See how shared inboxes work",
          }}
          quote={{
            text: "We used to lose half a morning working out who owned a thread. Now every email has one name on it, and the reply is out before lunch.",
            name: "Priya Raman",
            role: "Head of Support",
            company: "Northwind",
            avatar: portrait,
            result: "Cut support replies from 4 hours to 40 minutes",
          }}
        />
      </Example>
      <div className="mt-20 border-t border-border pt-12 sm:mt-24">
        <Example caption="Reversed on a wide screen, with the person's initials in place of a picture. On a phone the feature still comes first">
          <FeatureWithQuote
            reverse
            headingLevel={3}
            feature={{
              eyebrow: "Scheduled digests",
              title: "The weekly report writes itself",
              description: "Choose the numbers once. Halcyon builds the summary every Monday and sends it to the people who need it, so the status meeting starts from the facts.",
              points: ["Pick any dashboard or saved view", "Send to people, channels or a client", "Skip a week when nothing changed"],
              href: "#digests",
            }}
            quote={{
              text: "I stopped building the Monday report by hand in March. It arrives in everyone's inbox at eight, and the numbers are the ones we argue about in the meeting.",
              name: "Tomas Berg",
              role: "Operations lead",
              company: "Kestrel Freight",
              result: "Saved eleven hours a week on reporting",
            }}
          />
        </Example>
      </div>
    </div>
  );
}
