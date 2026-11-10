import { FooterTrustMarks, type TrustMark } from "@rhs-ui/marketing/footer-trust-marks";

/* Three marks drawn for the demo, dark on a clear ground like real artwork, so the tile can grey them and lighten them in the dark theme.
   In your footer: the issuers' own files. */
const art = (width: number, height: number, body: string) =>
  "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${width} ${height}' width='${width}' height='${height}' fill='none'>${body}</svg>`);

const ROUNDEL = art(
  96,
  96,
  "<circle cx='48' cy='48' r='44' stroke='#222' stroke-width='4'/><circle cx='48' cy='48' r='34' stroke='#222' stroke-width='2'/><path d='M29 57l12-24 7 14 7-14 12 24' stroke='#222' stroke-width='5' stroke-linecap='round' stroke-linejoin='round'/>",
);
const SHIELD = art(
  80,
  96,
  "<path d='M40 4l32 12v28c0 22-14 38-32 46C22 82 8 66 8 44V16z' stroke='#222' stroke-width='5' stroke-linejoin='round'/><path d='M25 48l11 11 20-23' stroke='#222' stroke-width='6' stroke-linecap='round' stroke-linejoin='round'/>",
);
const WORDMARK = art(
  220,
  44,
  "<text x='0' y='32' font-family='Arial, Helvetica, sans-serif' font-size='32' font-weight='700' letter-spacing='7' fill='#222'>LUMEN</text><rect x='0' y='38' width='214' height='3' fill='#222'/>",
);

const MARKS: readonly TrustMark[] = [
  { label: "Approved contractor", issuer: "Northwind Trade Council", since: 2009, href: "https://example.com/register/ntc-20931", image: ROUNDEL },
  { label: "Certified installer", issuer: "Installers Guild", since: 2014, href: "https://example.com/register/guild-4471" },
  { label: "Quality mark", issuer: "Halcyon Standards", since: 2017, image: SHIELD },
  { label: "Safety registered", issuer: "Polder Safety Register", since: 2012, href: "https://example.com/register/polder-88213" },
  { label: "Heat pump accredited", issuer: "Kestrel Board", since: 2021 },
  { label: "Member", issuer: "Lumen Federation", since: 2006, image: WORDMARK },
];

const COLUMNS = [
  {
    title: "Services",
    links: [
      { label: "Boilers", href: "#boilers" },
      { label: "Heat pumps", href: "#heat-pumps" },
      { label: "Solar panels", href: "#solar" },
      { label: "Servicing", href: "#servicing" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About us", href: "#about" },
      { label: "Reviews", href: "#reviews" },
      { label: "Careers", href: "#careers" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Emergency repairs", href: "#emergency" },
      { label: "Book a visit", href: "#book" },
      { label: "Contact", href: "#contact" },
    ],
  },
];

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto grid max-w-6xl gap-14 px-6 py-6">
      <figure className="grid gap-3">
        <figcaption className="text-xs leading-relaxed text-muted-foreground">
          Six marks of one size: three with the issuer&apos;s artwork, greyed, and three set as text marks. Three link to their register entry. From 768px the tiles sit in a grid that follows the number of marks, so no row ends with a lone tile: three by two, and one row of six from 1280px. On a phone the row scrolls sideways with fading edges.
        </figcaption>
        <div className="overflow-hidden rounded-xl border border-border bg-background">
          <FooterTrustMarks
            brand={<span className="text-lg font-semibold tracking-tight">Kestrel Heating</span>}
            tagline="Boilers, heat pumps and solar panels, fitted by our own engineers in Utrecht and the villages around it."
            columns={COLUMNS}
            marks={MARKS}
            legal="© 2026 Kestrel Heating B.V."
            legalLinks={[
              { label: "Privacy", href: "#privacy" },
              { label: "Terms", href: "#terms" },
              { label: "Complaints", href: "#complaints" },
            ]}
          />
        </div>
      </figure>

      <figure className="grid gap-3">
        <figcaption className="text-xs leading-relaxed text-muted-foreground">
          Four text marks, none of them a link, fill one row. The issuer is still each tile&apos;s name, and on a phone the row is a labelled region the keyboard can scroll.
        </figcaption>
        <div className="overflow-hidden rounded-xl border border-border bg-background">
          <FooterTrustMarks
            navLabel="Footer, accountants"
            brand={<span className="text-lg font-semibold tracking-tight">Polder &amp; Partners</span>}
            columns={[
              {
                title: "Accountancy",
                links: [
                  { label: "Annual accounts", href: "#accounts" },
                  { label: "Payroll", href: "#payroll" },
                  { label: "Tax returns", href: "#tax" },
                ],
              },
              {
                title: "Firm",
                links: [
                  { label: "Partners", href: "#partners" },
                  { label: "Contact", href: "#contact" },
                ],
              },
            ]}
            marks={[
              { label: "Registered accountants", issuer: "Northwind Institute", since: 1998 },
              { label: "Quality reviewed", issuer: "Halcyon Review Board", since: 2016 },
              { label: "Data protection", issuer: "Kestrel Privacy Seal", since: 2022 },
              { label: "Chartered member", issuer: "Lumen Society", since: 2003 },
            ]}
            legal="© 2026 Polder & Partners"
            labels={{ marks: "Memberships and quality marks" }}
          />
        </div>
      </figure>
    </div>
  );
}
