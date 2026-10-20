import { IconCheck } from "@rhs-ui/icons";
import { Rating } from "@rhs-ui/primitives/rating";
import { ProductInfoTabs, type ProductInfoSection } from "@rhs-ui/commerce/product-info-tabs";

const DETAILS: [string, string][] = [
  ["Materials", "Powder-coated steel arm and shade, fabric-covered cable"],
  ["Dimensions", "48 cm tall, arm reach 32 cm, shade 18 cm across"],
  ["Weight", "1.9 kg"],
  ["Light source", "E27 bulb, up to 9 W. A warm 2700 K bulb is included."],
  ["Cable", "1.8 m, with a dimmer you can reach from the chair"],
  ["Care", "Wipe with a dry cloth. Do not use abrasive cleaners."],
];

const REVIEWS = [
  { name: "Marit V.", when: "12 February 2026", score: 5, title: "Exactly the reading light I wanted", text: "It sits over the arm of the sofa without taking up any floor. The dimmer on the cord is a small thing that I use every evening." },
  { name: "Joost B.", when: "28 January 2026", score: 4, title: "Solid, and the shade stays cool", text: "Well made and heavier than it looks, so it does not tip. I would have liked the cable a little longer." },
];

const SECTIONS: ProductInfoSection[] = [
  {
    id: "description",
    title: "Description",
    content: (
      <div className="grid max-w-2xl gap-4">
        <p>A slim steel arm that reaches over a desk or a bedside table and keeps the light exactly where you read. The shade is spun in one piece and finished in a soft powder coat that stays cool to the touch.</p>
        <p>The dimmer sits on the cord, within reach of your hand, and the warm bulb that comes with it is rated for 15,000 hours.</p>
        <ul className="grid gap-2 text-foreground">
          {["Powder-coated steel arm and shade", "Dimmer on the cord, no extra switch to find", "Bulb included, ready to plug in"].map((point) => (
            <li key={point} className="flex items-center gap-2.5">
              <IconCheck className="size-4 shrink-0" />
              {point}
            </li>
          ))}
        </ul>
      </div>
    ),
  },
  {
    id: "details",
    title: "Details",
    content: (
      <dl className="grid max-w-2xl">
        {DETAILS.map(([term, value]) => (
          <div key={term} className="grid gap-x-8 gap-y-1 border-b border-border py-3 first:pt-0 last:border-b-0 sm:grid-cols-[9rem_minmax(0,1fr)]">
            <dt className="font-medium text-foreground">{term}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    ),
  },
  {
    id: "shipping",
    title: "Shipping and returns",
    content: (
      <ul className="grid max-w-2xl gap-3">
        <li>Free delivery on orders over €75. Orders placed before 15:00 leave the warehouse the same working day.</li>
        <li>Delivered in two to four working days across the EU, with tracking from the moment it ships.</li>
        <li>30 days to change your mind. Returns are free for unused items in their original packaging.</li>
      </ul>
    ),
  },
  {
    id: "reviews",
    title: "Reviews",
    badge: 128,
    content: (
      <div className="grid max-w-2xl gap-6">
        <div className="flex items-center gap-3">
          <p className="text-3xl font-semibold tracking-[-0.03em] text-foreground tabular-nums">4.6</p>
          <div className="grid gap-1">
            <Rating readOnly value={4.6} size={16} label="Average rating" />
            <p className="text-xs">Based on 128 reviews</p>
          </div>
        </div>
        <ul className="grid gap-5">
          {REVIEWS.map((review) => (
            <li key={review.name} className="grid gap-1.5 border-t border-border pt-5">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <Rating readOnly value={review.score} size={14} label="Rated" />
                <p className="text-sm font-medium text-foreground">{review.title}</p>
              </div>
              <p>{review.text}</p>
              <p className="text-xs">
                {review.name}, {review.when}
              </p>
            </li>
          ))}
        </ul>
      </div>
    ),
  },
];

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-14">
      <header className="grid gap-2 pb-10">
        <p className="text-xs text-muted-foreground">Lighting / Table lamps</p>
        <h2 className="text-3xl font-semibold tracking-[-0.03em]">Arc table lamp</h2>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Rating readOnly value={4.6} size={16} label="Rated" />
          <a href="#reviews" className="underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:rounded-sm focus-visible:ring-[3px] focus-visible:ring-ring/40">
            128 reviews
          </a>
        </div>
        <p className="text-lg font-medium tabular-nums">€129.00</p>
      </header>
      <ProductInfoTabs sections={SECTIONS} />
    </div>
  );
}
