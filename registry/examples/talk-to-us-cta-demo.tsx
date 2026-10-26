import { IconCalendar, IconMail } from "@rhs-ui/icons";
import { TalkToUsCta } from "@rhs-ui/marketing/talk-to-us-cta";
import { Button } from "@rhs-ui/primitives/button";

// Drawn portraits as data URIs, so the preview needs no image host.
const portrait = (background: string, figure: string) =>
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96'><rect width='96' height='96' fill='${background}'/><circle cx='48' cy='38' r='17' fill='${figure}'/><path d='M14 96c4-22 18-33 34-33s30 11 34 33z' fill='${figure}'/></svg>`,
  );

const maya = { name: "Maya Okafor", role: "Customer success", avatar: portrait("#d9d6cf", "#4a463f") };
const tomas = { name: "Tomás Ribeiro", role: "Solutions engineer", avatar: portrait("#2c2f33", "#cfcbc2") };
const jun = { name: "Jun Park", role: "Billing and plans" };

function Actions({ call }: { call: string }): React.JSX.Element {
  return (
    <>
      <Button size="lg">
        <IconCalendar />
        {call}
      </Button>
      <Button size="lg" variant="outline" asChild>
        <a href="mailto:hello@halcyon.example">
          <IconMail />
          Send an email
        </a>
      </Button>
    </>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-5xl px-6 py-10 sm:py-16">
      <p className="mb-6 text-xs text-muted-foreground">One person, online: the usual closing ask after a FAQ or beside pricing</p>
      <TalkToUsCta
        people={[maya]}
        title="Not sure which plan fits? Talk to Maya."
        description="Tell her what your team does and she will tell you honestly which plan you need, and which you do not."
        availability="Online now, replies in about 10 minutes"
        status="online"
        actions={<Actions call="Book a 20-minute call" />}
      />

      <div className="mt-16 grid gap-x-8 gap-y-14 lg:grid-cols-2">
        <div className="min-w-0">
          <p className="mb-6 text-xs text-muted-foreground">A small team, away: the dot is a ring, and the words say when they are back</p>
          <TalkToUsCta
            headingLevel={3}
            people={[maya, tomas, jun]}
            title="Questions before you commit? Ask us."
            availability="Away until 13:00, replies this afternoon"
            status="away"
            actions={<Actions call="Book a call" />}
          />
        </div>
        <div className="min-w-0">
          <p className="mb-6 text-xs text-muted-foreground">Offline: a thin ring, and a promise of when the answer comes</p>
          <TalkToUsCta
            headingLevel={3}
            people={[tomas]}
            title="Want a walkthrough? Talk to Tomás."
            availability="Offline until 09:00, replies first thing tomorrow"
            status="offline"
            actions={<Actions call="Book a walkthrough" />}
          />
        </div>
      </div>
    </div>
  );
}
