import { BrandIndex, type Brand } from "@rhs-ui/commerce/brand-index";

/** A wordmark drawn as SVG text. It is shown as a one-colour silhouette, so only its shape matters. */
const mark = (inner: string) => "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 160 48'>${inner}</svg>`);
const FONT = "font-family='Helvetica Neue, Helvetica, Arial, sans-serif'";

const NORTHWIND = mark(`<path d='M10 36V12l15 24V12' fill='none' stroke='#111' stroke-width='5' stroke-linejoin='round'/><text x='38' y='31' ${FONT} font-size='17' font-weight='700' fill='#111' textLength='110' lengthAdjust='spacingAndGlyphs'>NORTHWIND</text>`);
const KESTREL = mark(`<path d='M8 32L24 14l5 9 12-13-4 24z' fill='#111'/><text x='50' y='32' ${FONT} font-size='24' font-weight='800' fill='#111' textLength='96' lengthAdjust='spacingAndGlyphs'>kestrel</text>`);
const HALCYON = mark(`<text x='14' y='30' font-family='Georgia, Times New Roman, serif' font-size='26' font-style='italic' font-weight='700' fill='#111' textLength='132' lengthAdjust='spacingAndGlyphs'>Halcyon</text><path d='M14 38c10-6 18 6 28 0s18 6 28 0 18 6 28 0 18 6 32 0' fill='none' stroke='#111' stroke-width='2.5' stroke-linecap='round'/>`);
const FIELDWORK = mark(`<rect x='12' y='9' width='136' height='4' fill='#111'/><text x='14' y='36' ${FONT} font-size='18' font-weight='800' fill='#111' textLength='132' lengthAdjust='spacingAndGlyphs'>FIELDWORK</text>`);

const BRANDS: readonly Brand[] = [
  { name: "Alder & Oak", href: "#alder-oak", count: 34 },
  { name: "Atlas Goods", href: "#atlas-goods", count: 12 },
  { name: "Aurora Ceramics", href: "#aurora-ceramics", count: 8 },
  { name: "Bellwether", href: "#bellwether", count: 21 },
  { name: "Birchwood Co", href: "#birchwood", count: 15 },
  { name: "Brightwater", href: "#brightwater", count: 9 },
  { name: "Cairn Outdoor", href: "#cairn-outdoor", count: 27 },
  { name: "Copperleaf", href: "#copperleaf", count: 18 },
  { name: "Driftwood Home", href: "#driftwood-home", count: 11 },
  { name: "Dunmore", href: "#dunmore", count: 6 },
  { name: "Eastfield", href: "#eastfield", count: 14 },
  { name: "Ember & Ash", href: "#ember-ash", count: 22 },
  { name: "Fernhill", href: "#fernhill", count: 7 },
  { name: "Fieldwork", href: "#fieldwork", count: 40, logo: { src: FIELDWORK, alt: "Fieldwork" } },
  { name: "Granite Peak", href: "#granite-peak", count: 19 },
  { name: "Greywether", href: "#greywether", count: 5 },
  { name: "Halcyon", href: "#halcyon", count: 48, logo: { src: HALCYON, alt: "Halcyon" } },
  { name: "Harbour Light", href: "#harbour-light", count: 13 },
  { name: "Hollis & Rowe", href: "#hollis-rowe", count: 9 },
  { name: "Ironbridge", href: "#ironbridge", count: 16 },
  { name: "Isle Studio", href: "#isle-studio", count: 4 },
  { name: "Juniper Lane", href: "#juniper-lane", count: 10 },
  { name: "Kestrel", href: "#kestrel", count: 56, logo: { src: KESTREL, alt: "Kestrel" } },
  { name: "Kiln & Clay", href: "#kiln-clay", count: 12 },
  { name: "Knoll Street", href: "#knoll-street", count: 3 },
  { name: "Larkspur", href: "#larkspur", count: 17 },
  { name: "Lowland", href: "#lowland", count: 8 },
  { name: "Meridian", href: "#meridian", count: 33 },
  { name: "Millstone", href: "#millstone", count: 14 },
  { name: "Moss & Co", href: "#moss-co", count: 6 },
  { name: "Nettle & Thread", href: "#nettle-thread", count: 9 },
  { name: "Northwind", href: "#northwind", count: 61, logo: { src: NORTHWIND, alt: "Northwind" } },
  { name: "Oakmere", href: "#oakmere", count: 12 },
  { name: "Orchard Row", href: "#orchard-row", count: 7 },
  { name: "Pennant", href: "#pennant", count: 25 },
  { name: "Pinewood", href: "#pinewood", count: 13 },
  { name: "Plover", href: "#plover", count: 5 },
  { name: "Redwing", href: "#redwing", count: 29 },
  { name: "Rowan", href: "#rowan", count: 11 },
  { name: "Saltmarsh", href: "#saltmarsh", count: 18 },
  { name: "Sparrow Hill", href: "#sparrow-hill", count: 6 },
  { name: "Stonecrop", href: "#stonecrop", count: 21 },
  { name: "Tern", href: "#tern", count: 15 },
  { name: "Thistle & Pine", href: "#thistle-pine", count: 8 },
  { name: "Tidewater", href: "#tidewater", count: 23 },
  { name: "Upland", href: "#upland", count: 9 },
  { name: "Verdant", href: "#verdant", count: 10 },
  { name: "Vesper", href: "#vesper", count: 14 },
  { name: "Westmoor", href: "#westmoor", count: 7 },
  { name: "Wildwood", href: "#wildwood", count: 12 },
  { name: "Wren", href: "#wren", count: 20 },
  { name: "Yarrow", href: "#yarrow", count: 6 },
  { name: "1898 Mill", href: "#1898-mill", count: 5 },
  { name: "Élan Atelier", href: "#elan-atelier", count: 8 },
];

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto w-full max-w-5xl min-w-0 px-4 py-10 sm:px-6 sm:py-14">
      <BrandIndex brands={BRANDS} popular={["Northwind", "Kestrel", "Halcyon", "Fieldwork", "Meridian", "Cairn Outdoor"]} locale="en-GB" />
    </div>
  );
}
