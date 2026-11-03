import { PromoSliderHero, type PromoSlide } from "@rhs-ui/marketing/promo-slider-hero";

/* The pictures are drawn for the demo, so it needs no files. In your shop: each campaign's real photograph. */
const scene = (alt: string, ground: string, shapes: string): PromoSlide["image"] => ({
  src: "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1000 800'><rect width='1000' height='800' fill='${ground}'/>${shapes}</svg>`),
  alt,
  width: 1000,
  height: 800,
});

const linen = scene(
  "A stack of folded linen next to a ceramic cup",
  "#dcd6ca",
  [
    "<circle cx='690' cy='290' r='185' fill='#cfc7b6'/>",
    "<rect y='560' width='1000' height='240' fill='#cdc5b5'/>",
    "<ellipse cx='400' cy='612' rx='250' ry='22' fill='#000' opacity='.14'/>",
    "<rect x='170' y='510' width='460' height='84' rx='16' fill='#f3efe6'/>",
    "<rect x='192' y='440' width='416' height='78' rx='16' fill='#e7e1d3'/>",
    "<rect x='214' y='376' width='372' height='72' rx='16' fill='#d4ccba'/>",
    "<path d='M170 552h460M192 479h416M214 412h372' stroke='#000' stroke-opacity='.07' stroke-width='2'/>",
    "<ellipse cx='770' cy='606' rx='86' ry='13' fill='#000' opacity='.14'/>",
    "<rect x='704' y='470' width='132' height='136' rx='22' fill='#8d8472'/>",
    "<ellipse cx='770' cy='470' rx='66' ry='14' fill='#6f675a'/>",
  ].join(""),
);

const lamp = scene(
  "An opal glass table lamp on an oak base",
  "#2b2d30",
  [
    "<rect y='640' width='1000' height='160' fill='#222427'/>",
    "<ellipse cx='500' cy='636' rx='150' ry='16' fill='#000' opacity='.3'/>",
    "<ellipse cx='500' cy='628' rx='96' ry='14' fill='#8a6f4d'/>",
    "<rect x='404' y='596' width='192' height='32' rx='8' fill='#a2825a'/>",
    "<rect x='493' y='330' width='14' height='270' rx='7' fill='#6d7178'/>",
    "<path d='M350 346a150 132 0 0 1 300 0z' fill='#efebe2'/>",
    "<ellipse cx='500' cy='346' rx='150' ry='20' fill='#d8d2c4'/>",
    "<circle cx='500' cy='346' r='7' fill='#bdb6a5'/>",
  ].join(""),
);

const delivery = scene(
  "A parcel on a doorstep",
  "#e4e1da",
  [
    "<rect y='590' width='1000' height='210' fill='#d3cfc5'/>",
    "<ellipse cx='500' cy='648' rx='250' ry='30' fill='#000' opacity='.13'/>",
    "<polygon points='500,210 700,310 500,410 300,310' fill='#f6f3ec'/>",
    "<polygon points='300,310 500,410 500,630 300,530' fill='#dcd6c8'/>",
    "<polygon points='500,410 700,310 700,530 500,630' fill='#c8c0ae'/>",
    "<polygon points='420,250 620,350 580,370 380,270' fill='#d3cab6'/>",
    "<polygon points='580,370 620,350 620,470 580,490' fill='#b9af9a'/>",
    "<polygon points='340,407 410,442 410,508 340,473' fill='#f6f3ec'/>",
    "<polygon points='352,421 394,442 394,449 352,428' fill='#bdb5a3'/>",
    "<polygon points='352,440 380,454 380,461 352,447' fill='#d3cdbd'/>",
  ].join(""),
);

const gift = scene(
  "Two gift cards fanned out",
  "#bcbab5",
  [
    "<ellipse cx='500' cy='640' rx='300' ry='22' fill='#000' opacity='.14'/>",
    "<g transform='rotate(-9 440 380)'><rect x='230' y='245' width='440' height='280' rx='26' fill='#f6f4ee'/><circle cx='300' cy='318' r='26' fill='#2b2d30'/><rect x='270' y='430' width='210' height='14' rx='7' fill='#c9c5ba'/><rect x='270' y='460' width='140' height='14' rx='7' fill='#d9d6cd'/></g>",
    "<g transform='rotate(7 560 430)'><rect x='340' y='300' width='440' height='280' rx='26' fill='#2b2d30'/><circle cx='712' cy='372' r='26' fill='#f6f4ee' opacity='.9'/><rect x='376' y='486' width='210' height='14' rx='7' fill='#5a5d63'/><rect x='376' y='516' width='140' height='14' rx='7' fill='#43464b'/></g>",
  ].join(""),
);

const slides: readonly PromoSlide[] = [
  {
    id: "autumn-linen",
    eyebrow: "Autumn sale",
    title: "Linen that gets softer with every wash.",
    description: "Bed sets, throws and napkins from €24, in six natural shades. The sale ends on 30 November.",
    cta: { label: "Shop the linen sale", href: "#linen" },
    image: linen,
    tone: "plain",
  },
  {
    id: "oslo-lamp",
    eyebrow: "New this week",
    title: "Meet the Oslo lamp.",
    description: "Hand-blown opal glass on a solid oak base. Dimmable, and built to be repaired rather than replaced.",
    cta: { label: "See the Oslo lamp", href: "#oslo" },
    image: lamp,
    tone: "inverse",
  },
  {
    id: "free-delivery",
    eyebrow: "Free delivery",
    title: "Free delivery on every order over €50.",
    description: "Order before 4 pm and it is at your door tomorrow. Returns are free for 30 days.",
    cta: { label: "How delivery works", href: "#delivery" },
    image: delivery,
    tone: "muted",
  },
  {
    id: "gift-cards",
    eyebrow: "Gift cards",
    title: "A gift that fits every home.",
    description: "Send a Halcyon card by email in seconds, or have one posted in a linen envelope.",
    cta: { label: "Choose a gift card", href: "#gift-cards" },
    image: gift,
    tone: "plain",
  },
];

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6">
      <PromoSliderHero label="Current promotions" slides={slides} />
    </div>
  );
}
