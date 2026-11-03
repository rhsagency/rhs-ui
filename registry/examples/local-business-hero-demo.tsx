import { LocalBusinessHero } from "@rhs-ui/marketing/local-business-hero";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const week = (...hours: (string | null)[]) => DAYS.map((day, index) => ({ day, hours: hours[index] ?? null }));

/* The shopfront is drawn for the demo, so it needs no file. In your site: a photo of the real front. */
const awning = Array.from({ length: 13 }, (_, index) => {
  const fill = index % 2 ? "#f4f0e7" : "#c9c1b0";
  return `<rect x='${120 + index * 80}' y='154' width='80' height='46' fill='${fill}'/><circle cx='${160 + index * 80}' cy='200' r='40' fill='${fill}'/>`;
}).join("");

/* A bicycle from its rear hub: two wheels, a frame, a saddle and handlebars. */
const bike = (x: number) => {
  const y = 510;
  return (
    `<g fill='none' stroke='#2b2d30' stroke-width='7' stroke-linecap='round' stroke-linejoin='round'>` +
    `<circle cx='${x}' cy='${y}' r='50'/><circle cx='${x + 140}' cy='${y}' r='50'/>` +
    `<path d='M${x} ${y}L${x + 45} ${y - 72}L${x + 118} ${y - 72}L${x + 60} ${y}ZM${x + 45} ${y - 72}L${x} ${y}M${x + 118} ${y - 72}L${x + 140} ${y}M${x + 106} ${y - 88}h28M${x + 30} ${y - 82}h30'/>` +
    `</g>`
  );
};

const front =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1280 720'>` +
      `<rect width='1280' height='720' fill='#d9d4c8'/>` +
      `<rect y='612' width='1280' height='108' fill='#bdb7a8'/>` +
      `<rect x='120' y='70' width='1040' height='542' fill='#ece7dc'/>` +
      `<rect x='120' y='70' width='1040' height='84' fill='#2b2d30'/>` +
      `<text x='640' y='127' text-anchor='middle' font-family='Georgia, serif' font-size='42' letter-spacing='7' fill='#ece7dc'>KESTREL FIETSEN</text>` +
      awning +
      `<rect x='170' y='262' width='560' height='312' fill='#b8bec2' stroke='#2b2d30' stroke-width='10'/>` +
      `<path d='M200 574l120-312h70L270 574zM430 574l120-312h40L470 574z' fill='#cdd2d5'/>` +
      bike(245) +
      bike(510) +
      `<rect x='790' y='262' width='170' height='350' fill='#8d8472'/>` +
      `<rect x='812' y='286' width='126' height='214' fill='#b8bec2'/>` +
      `<circle cx='936' cy='470' r='8' fill='#ece7dc'/>` +
      `<rect x='1000' y='262' width='130' height='312' fill='#b8bec2' stroke='#2b2d30' stroke-width='10'/>` +
      `<rect x='1030' y='330' width='70' height='96' fill='#ece7dc'/>` +
      `<rect x='1042' y='344' width='46' height='8' fill='#8d8472'/><rect x='1042' y='364' width='46' height='6' fill='#c9c1b0'/><rect x='1042' y='380' width='34' height='6' fill='#c9c1b0'/>` +
      `</svg>`,
  );

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6">
      <p className="pt-6 text-xs text-muted-foreground">Tuesday at 14:30 in Nijmegen: open, with the closing time, a photo and an email address.</p>
      <LocalBusinessHero
        name="Kestrel Fietsen"
        tagline="Repairs the same day, new and second-hand bikes, and a coffee while you wait."
        phone="024 123 45 67"
        email="hello@kestrelfietsen.nl"
        address={["Kerkstraat 14", "6511 AB Nijmegen"]}
        directionsHref="#directions"
        timeZone="Europe/Amsterdam"
        now="2026-11-03T14:30:00+01:00"
        className="py-8 sm:py-10"
        image={{ src: front, alt: "The shopfront of Kestrel Fietsen, with two bikes in the window", width: 1280, height: 720 }}
        hours={week("13:00 to 18:00", "09:00 to 18:00", "09:00 to 18:00", "09:00 to 18:00", "09:00 to 18:00", "09:00 to 17:00", null)}
      />

      <p className="border-t border-border pt-6 text-xs text-muted-foreground">Sunday at 11:00 in Utrecht: closed, and the next opening named by its day. No photo, no email.</p>
      <LocalBusinessHero
        name="Atelier Maren"
        tagline="Cut, colour and care by appointment, in a bright studio on the canal."
        phone="030 987 65 43"
        address="Oudegracht 112, 3511 AW Utrecht"
        directionsHref="#directions"
        timeZone="Europe/Amsterdam"
        now="2026-11-01T11:00:00+01:00"
        className="py-8 sm:py-10"
        hours={week(null, "09:30 to 18:00", "09:30 to 18:00", "09:30 to 20:00", "09:30 to 18:00", "09:00 to 16:00", null)}
      />
    </div>
  );
}
