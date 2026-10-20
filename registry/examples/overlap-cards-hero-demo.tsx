import { IconCalculator, IconCalendar, IconFileCheck, IconHeadphones, IconStethoscope, IconUserCircle } from "@rhs-ui/icons";
import { OverlapCardsHero } from "@rhs-ui/marketing/overlap-cards-hero";

/* A scene drawn for the demo. In your app: a real photo; the scrim keeps the copy readable over it. */
const scenery =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1600 900' preserveAspectRatio='xMidYMid slice'><rect width='1600' height='900' fill='#cfcdc7'/><circle cx='1180' cy='290' r='190' fill='#ebe9e4'/><path d='M0 640C260 520 420 560 640 470S1040 400 1600 540V900H0Z' fill='#8d8a82'/><path d='M0 760C320 660 560 720 860 640S1320 600 1600 700V900H0Z' fill='#5f5d57'/></svg>",
  );

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6">
      <p className="pt-6 text-xs text-muted-foreground">Solid panel</p>
      <OverlapCardsHero
        eyebrow="Meridian Mutual"
        title="Cover that keeps pace with your life."
        description="Home, car and small-business insurance, explained in plain language and settled in days, not weeks."
        cta={{ label: "Compare plans", href: "#plans" }}
        cards={[
          { icon: <IconFileCheck />, title: "Report a claim", description: "Tell us what happened and follow every step online.", href: "#claim" },
          { icon: <IconCalculator />, title: "Get a quote", description: "Cover for your home, car or business in about four minutes.", href: "#quote" },
          { icon: <IconHeadphones />, title: "Talk to an adviser", description: "A real person, Monday to Saturday, from eight to eight.", href: "#adviser" },
        ]}
      />
      <p className="pt-8 text-xs text-muted-foreground">With a photo and a scrim, and a section that follows</p>
      <OverlapCardsHero
        eyebrow="Lindenhof Clinic"
        title="Care that starts with a conversation."
        description="Family doctors, specialists and a patient portal that remembers what you told us last time."
        cta={{ label: "Book an appointment", href: "#book" }}
        media={<img src={scenery} alt="" />}
        cards={[
          { icon: <IconCalendar />, title: "Book an appointment", description: "Pick a time that suits you; most weeks there is one tomorrow.", href: "#book" },
          { icon: <IconStethoscope />, title: "Find a specialist", description: "Cardiology, dermatology, physiotherapy and 14 more.", href: "#specialists" },
          { icon: <IconUserCircle />, title: "Patient portal", description: "Results, prescriptions and messages in one place.", href: "#portal" },
        ]}
      />
      <p className="pt-10 pb-6 text-sm text-muted-foreground">The next section starts here, after the cards, never under them.</p>
    </div>
  );
}
