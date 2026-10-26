import { OfficeList, type Office } from "@rhs-ui/marketing/office-list";

/** A calm street grid with a pin, drawn inline so the preview needs no map service. */
function CityMap({ seed }: { seed: number }): React.JSX.Element {
  const slant = 24 + seed * 9;
  return (
    <svg aria-hidden="true" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 size-full text-foreground">
      {Array.from({ length: 16 }, (_, index) => (
        <line key={`v${index}`} x1={index * 28 - seed * 11} x2={index * 28 - seed * 11 - slant} y1="0" y2="300" stroke="currentColor" strokeOpacity="0.07" strokeWidth={index % 5 === 0 ? 9 : 2} />
      ))}
      {Array.from({ length: 11 }, (_, index) => (
        <line key={`h${index}`} x1="0" x2="400" y1={index * 30 + seed * 7} y2={index * 30 + seed * 7 + 18} stroke="currentColor" strokeOpacity="0.07" strokeWidth={index % 4 === 0 ? 9 : 2} />
      ))}
      <path d={`M0 ${210 - seed * 14} C 120 ${150 + seed * 10}, 240 ${250 - seed * 8}, 400 ${120 + seed * 16}`} fill="none" stroke="currentColor" strokeOpacity="0.1" strokeWidth="14" strokeLinecap="round" />
      <circle cx={196 + seed * 12} cy={148 - seed * 8} r="10" fill="currentColor" />
      <circle cx={196 + seed * 12} cy={148 - seed * 8} r="23" fill="none" stroke="currentColor" strokeOpacity="0.3" />
    </svg>
  );
}

const weekdays = ["mon", "tue", "wed", "thu", "fri"] as const;

const offices: Office[] = [
  {
    id: "amsterdam",
    city: "Amsterdam",
    name: "Head office",
    address: ["Keizersgracht 241", "1016 EA Amsterdam", "Netherlands"],
    phone: "+31 20 555 0142",
    email: "amsterdam@halcyon.example",
    timeZone: "Europe/Amsterdam",
    hours: [{ days: weekdays, opens: "09:00", closes: "18:00" }],
    directionsHref: "#amsterdam",
    map: <CityMap seed={0} />,
  },
  {
    id: "berlin",
    city: "Berlin",
    name: "Design studio",
    address: ["Torstraße 112", "10119 Berlin", "Germany"],
    phone: "+49 30 5557 0188",
    email: "berlin@halcyon.example",
    timeZone: "Europe/Berlin",
    hours: [
      { days: weekdays, opens: "09:00", closes: "12:30" },
      { days: weekdays, opens: "13:30", closes: "17:30" },
    ],
    directionsHref: "#berlin",
    map: <CityMap seed={1} />,
  },
  {
    id: "new-york",
    city: "New York",
    name: "North America",
    address: ["88 Greene Street, 4th floor", "New York, NY 10012", "United States"],
    phone: "+1 (212) 555-0163",
    email: "newyork@halcyon.example",
    timeZone: "America/New_York",
    hours: [
      { days: weekdays, opens: "09:00", closes: "17:00" },
      { days: ["sat"], opens: "10:00", closes: "14:00" },
    ],
    directionsHref: "#new-york",
    map: <CityMap seed={2} />,
  },
];

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10 sm:py-16">
      <p className="mb-8 text-xs text-muted-foreground">
        Pinned to Wednesday 28 October, 11:45 UTC so all three states show: Amsterdam is open, Berlin is at lunch, New York has not opened yet. Leave `now` out and the lines follow the reader&apos;s clock.
      </p>
      <OfficeList
        title="Find us"
        description="Three offices, one team. Every time below is the office's own, so you know whether someone is at their desk."
        offices={offices}
        now="2026-10-28T11:45:00Z"
      />

      <div className="mt-24">
        <p className="mb-8 text-xs text-muted-foreground">As tabs, on the reader&apos;s own clock: one office at a time, with its map beside the details</p>
        <OfficeList headingLevel={3} layout="tabs" title="Visit an office" offices={offices} />
      </div>
    </div>
  );
}
