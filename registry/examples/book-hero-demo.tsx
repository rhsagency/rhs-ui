import { BookHero } from "@rhs-ui/marketing/book-hero";

/* The covers are drawn for the demo, so they need no files. In your site: the jacket as a photograph or a flat image, two by three. */

const serif = "Georgia, 'Times New Roman', serif";
const sans = "'Helvetica Neue', Helvetica, Arial, sans-serif";

const saltRoad =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 1200'>` +
      `<defs><linearGradient id='sky' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#0e262e'/><stop offset='.5' stop-color='#2c5a60'/><stop offset='.82' stop-color='#d9a972'/><stop offset='1' stop-color='#ecc99a'/></linearGradient></defs>` +
      `<rect width='800' height='1200' fill='url(#sky)'/>` +
      `<circle cx='548' cy='742' r='128' fill='#f6e2b4'/>` +
      `<circle cx='548' cy='742' r='176' fill='#f6e2b4' opacity='.18'/>` +
      `<path d='M0 790Q130 748 270 782T560 770T800 786V1200H0Z' fill='#102a31'/>` +
      `<path d='M0 836Q180 806 360 830T800 824V1200H0Z' fill='#0b2026'/>` +
      `<path d='M318 1200L452 1200L414 826L394 826Z' fill='#efe6cf'/>` +
      `<path d='M368 1200L402 1200L406 900L398 900Z' fill='#0b2026' opacity='.22'/>` +
      `<text x='400' y='116' text-anchor='middle' font-family="${sans}" font-size='31' font-weight='600' letter-spacing='13' fill='#f4ead2'>INES MARLOWE</text>` +
      `<text x='400' y='318' text-anchor='middle' font-family="${serif}" font-size='132' font-weight='700' letter-spacing='-3' fill='#f4ead2'>The Salt</text>` +
      `<text x='400' y='448' text-anchor='middle' font-family="${serif}" font-size='132' font-weight='700' letter-spacing='-3' fill='#f4ead2'>Road</text>` +
      `<text x='400' y='532' text-anchor='middle' font-family="${serif}" font-size='38' font-style='italic' fill='#f4ead2' opacity='.85'>a novel</text>` +
      `</svg>`,
  );

const slowMornings =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 1200'>` +
      `<rect width='800' height='1200' fill='#e9b44c'/>` +
      `<text x='64' y='190' font-family="${sans}" font-size='138' font-weight='800' letter-spacing='-6' fill='#2a1d12'>Slow</text>` +
      `<text x='64' y='320' font-family="${sans}" font-size='138' font-weight='800' letter-spacing='-6' fill='#2a1d12'>Mornings</text>` +
      `<text x='68' y='382' font-family="${sans}" font-size='36' fill='#2a1d12' opacity='.8'>Breakfasts worth getting up for</text>` +
      `<g transform='translate(0 -56) translate(400 830) scale(.93) translate(-400 -830)'><circle cx='400' cy='830' r='318' fill='#f7f0df'/>` +
      `<circle cx='400' cy='830' r='318' fill='none' stroke='#2a1d12' stroke-opacity='.12' stroke-width='3'/>` +
      `<circle cx='400' cy='830' r='236' fill='#efe5cc'/>` +
      `<circle cx='352' cy='800' r='112' fill='#fffdf6'/><circle cx='458' cy='772' r='104' fill='#fffdf6'/><circle cx='430' cy='880' r='108' fill='#fffdf6'/><circle cx='344' cy='886' r='84' fill='#fffdf6'/>` +
      `<circle cx='418' cy='818' r='64' fill='#f0a216'/><ellipse cx='398' cy='796' rx='20' ry='12' fill='#fff' opacity='.55' transform='rotate(-24 398 796)'/>` +
      `<ellipse cx='300' cy='900' rx='24' ry='10' fill='#52713f' transform='rotate(-30 300 900)'/><ellipse cx='334' cy='920' rx='20' ry='9' fill='#6a8c4f' transform='rotate(20 334 920)'/><ellipse cx='486' cy='728' rx='22' ry='9' fill='#52713f' transform='rotate(35 486 728)'/>` +
      `<circle cx='440' cy='900' r='5' fill='#2a1d12'/><circle cx='470' cy='870' r='4' fill='#2a1d12'/><circle cx='388' cy='936' r='4' fill='#2a1d12'/><circle cx='372' cy='744' r='4' fill='#2a1d12'/></g>` +
      `<text x='64' y='1140' font-family="${sans}" font-size='34' font-weight='700' letter-spacing='9' fill='#2a1d12'>ANOUK BAKKER</text>` +
      `</svg>`,
  );

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6">
      <p className="pt-6 text-xs text-muted-foreground">A novel with three lines of praise to step through, a menu of shops and an extract. It is not out yet, so the date reads Publishes.</p>
      <BookHero
        className="py-8 sm:py-10 lg:py-12"
        cover={{ src: saltRoad, width: 800, height: 1200 }}
        title="The Salt Road"
        subtitle="Two sisters, one coast, and the summer they stop pretending."
        author="Ines Marlowe"
        praise={[
          { quote: "A quiet masterpiece. I read it in one sitting and started it again the next morning.", source: "The Halcyon Review" },
          { quote: "Marlowe writes about the sea the way other people write about love.", source: "Dara Whitfield, author of Low Tide" },
          { quote: "The best novel about sisters I have read in years, and the most generous.", source: "Kestrel Literary Supplement" },
        ]}
        retailers={[
          { label: "Northwind Books", href: "#northwind" },
          { label: "Halcyon Bookshop", href: "#halcyon" },
          { label: "Your local independent", href: "#local" },
        ]}
        extractHref="#extract"
        format="Hardcover, 336 pages"
        publishedAt="2027-03-04"
        labels={{ published: "Publishes {date}" }}
      />

      <p className="border-t border-border pt-6 text-xs text-muted-foreground">A self-published cookbook: one line of praise, one shop as a plain link, and its own wording for a date that has not come yet.</p>
      <BookHero
        className="py-8 sm:py-10 lg:py-12"
        cover={{ src: slowMornings, width: 800, height: 1200, alt: "Cover of Slow Mornings by Anouk Bakker: a fried egg on a plate, on yellow" }}
        title="Slow Mornings"
        subtitle="Eighty breakfasts for the days when there is time, and a few for the days when there is not."
        author="Anouk Bakker"
        praise={[{ quote: "The first cookbook I have cooked from before I finished reading it.", source: "Teo Alvarez, chef at Kestrel House" }]}
        retailers={[{ label: "Halcyon Bookshop", href: "#halcyon" }]}
        extractHref="#extract"
        format="Paperback, 224 pages"
        publishedAt="2027-05-18"
        labels={{ published: "Out {date}" }}
      />
    </div>
  );
}
