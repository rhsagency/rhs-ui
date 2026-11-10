import { FooterLocalBusiness } from "@rhs-ui/marketing/footer-local-business";

/** A drawn street plan for the preview: a canal, a few streets and a pin. In a real footer this is a static map image of your own. */
function MapArt(): React.JSX.Element {
  return (
    <svg viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <path d="M-10 150C70 118 120 176 190 134S300 92 340 112" fill="none" className="stroke-foreground/10" strokeWidth="20" strokeLinecap="round" />
      <g fill="none" className="stroke-background" strokeLinecap="round">
        <path d="M0 58H320M0 108H320" strokeWidth="7" />
        <path d="M72 0V200M164 0V200M252 0V200" strokeWidth="7" />
        <path d="M0 22L118 200M214 0L320 170" strokeWidth="3.5" />
        <path d="M0 160H60M280 40H320M110 80H214" strokeWidth="3.5" />
      </g>
      <g transform="translate(164 83)">
        <circle r="16" className="fill-foreground/10" />
        <circle r="8" className="fill-foreground" />
        <circle r="3" className="fill-background" />
      </g>
    </svg>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto grid max-w-6xl gap-3 px-6 py-6">
      <p className="text-xs leading-relaxed text-muted-foreground">
        Four blocks on one grid: the address, the week with today marked in words, the pages, and the route. The trade register and VAT numbers sit in the legal row.
      </p>
      <div className="overflow-hidden rounded-xl border border-border bg-background">
        <FooterLocalBusiness
          brand={<span className="text-lg font-semibold tracking-tight">De Linde Dental</span>}
          tagline="A family dental practice in the centre of Amersfoort. Check-ups, whitening and emergency care, with a hygienist on site."
          address={["Hof 14", "3811 CJ Amersfoort", "The Netherlands"]}
          phone="033 555 0187"
          email="praktijk@delinde.example"
          hours={{
            days: [
              { day: "Monday", hours: "08:30 to 17:00" },
              { day: "Tuesday", hours: "08:30 to 17:00" },
              { day: "Wednesday", hours: "08:30 to 17:00" },
              { day: "Thursday", hours: "08:30 to 20:00" },
              { day: "Friday", hours: "08:30 to 16:00" },
              { day: "Saturday", hours: null },
              { day: "Sunday", hours: null },
            ],
            today: 2,
            status: { open: true, text: "Open now, until 17:00" },
            note: "Closed on 27 April (King's Day) and 5 May.",
          }}
          routeHref="https://maps.example.com/?q=Hof+14+Amersfoort"
          routeNote="Free parking behind the practice, and five minutes on foot from Amersfoort Centraal."
          map={<MapArt />}
          links={[
            { label: "Check-ups", href: "#checkups" },
            { label: "Whitening", href: "#whitening" },
            { label: "Emergency care", href: "#emergency" },
            { label: "Insurance and prices", href: "#prices" },
            { label: "New patients", href: "#new-patients" },
          ]}
          registration={[
            { label: "KvK", value: "87654321" },
            { label: "BTW", value: "NL001234567B01" },
            { label: "BIG", value: "19012345601" },
          ]}
          legal="© 2026 De Linde Dental B.V."
          legalLinks={[
            { label: "Privacy", href: "#privacy" },
            { label: "Complaints", href: "#complaints" },
            { label: "Terms", href: "#terms" },
          ]}
        />
      </div>
    </div>
  );
}
