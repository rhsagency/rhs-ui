import { IconClipboardCheck, IconClock, IconLanguage, IconShieldCheck } from "@rhs-ui/icons";
import { AppointmentHero } from "@rhs-ui/marketing/appointment-hero";

/* Portraits drawn for the demo, so they need no files. In your site: the practitioners' real photos. */
function portrait(bg: string, skin: string, hair: string, top: string, style: "short" | "bun" | "long"): string {
  const cut = {
    short: `<path d='M27 34c-1-13 5-19 13-19s14 6 13 19c-3-6-8-9-13-9s-10 3-13 9z' fill='${hair}'/>`,
    bun: `<circle cx='40' cy='13' r='6' fill='${hair}'/><path d='M27 34c-1-13 5-19 13-19s14 6 13 19c-3-6-8-9-13-9s-10 3-13 9z' fill='${hair}'/>`,
    long: `<path d='M25 38c-3-17 4-24 15-24s18 7 15 24v13c-4 0-6-3-6-8V33c-5-1-9-4-11-9-3 4-7 7-12 9v10c0 5-2 8-6 8z' fill='${hair}'/>`,
  }[style];
  return (
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80'><rect width='80' height='80' fill='${bg}'/><path d='M10 80c0-16 13-26 30-26s30 10 30 26z' fill='${top}'/><rect x='34' y='44' width='12' height='14' rx='5' fill='${skin}'/><ellipse cx='40' cy='34' rx='13' ry='15' fill='${skin}'/>${cut}</svg>`,
    )
  );
}

const nair = portrait("#d9d4c9", "#b88866", "#2b2522", "#5f6b73", "long");
const berg = portrait("#cfd3d1", "#e2b896", "#8a6a44", "#2f3438", "short");

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6">
      <p className="pt-6 text-xs text-muted-foreground">Three free times as links, the urgent line under them and a second action. The third practitioner has no portrait, so the initials show.</p>
      <AppointmentHero
        titleAs="h2"
        className="py-8 sm:py-10 lg:py-12"
        title="Care that fits around your week"
        description="Halcyon Health Centre has family doctors, nurses and physiotherapists under one roof. Most patients are seen within two days."
        chips={[
          { label: "Insurance accepted", icon: <IconShieldCheck /> },
          { label: "Dutch, English, Arabic", icon: <IconLanguage /> },
          { label: "Same-day visits", icon: <IconClock /> },
        ]}
        slots={[
          { label: "Today", time: "14:30", dateTime: "2026-11-03T14:30", practitioner: { name: "Dr. Priya Nair", role: "Family doctor", image: nair }, href: "#book-1" },
          { label: "Tomorrow", time: "09:15", dateTime: "2026-11-04T09:15", practitioner: { name: "Jonas Berg", role: "Physiotherapist", image: berg }, href: "#book-2" },
          { label: "Thu 5 Nov", time: "11:00", dateTime: "2026-11-05T11:00", practitioner: { name: "Amira Haddad", role: "Practice nurse" }, href: "#book-3" },
        ]}
        urgent={{ label: "Urgent? Call us now", phone: "020 555 0142", hours: "Every day, 07:00 to 22:00" }}
        bookHref="#book"
        secondary={{ label: "Meet the team", href: "#team" }}
      />

      <p className="border-t border-border pt-6 text-xs text-muted-foreground">No free time: the card says when the next ones open instead of standing empty.</p>
      <AppointmentHero
        titleAs="h2"
        className="py-8 sm:py-10 lg:py-12"
        title="Move well again, without the wait"
        description="Physiotherapy and rehab with a plan you can follow at home, drawn up in your first session."
        chips={[
          { label: "Insurance accepted", icon: <IconShieldCheck /> },
          { label: "No referral needed", icon: <IconClipboardCheck /> },
        ]}
        slots={[]}
        nextOpening="New times open on Monday at 08:00."
        urgent={{ label: "Sprain or sudden pain? Call us", phone: "020 555 0177", hours: "Weekdays, 08:00 to 18:00" }}
        bookHref="#book"
      />
    </div>
  );
}
