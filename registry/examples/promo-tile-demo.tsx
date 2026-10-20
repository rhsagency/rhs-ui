import { ProductCard } from "@rhs-ui/commerce/product-card";
import type { ProductCardProduct } from "@rhs-ui/commerce/product-card/types";
import { PromoTile } from "@rhs-ui/commerce/promo-tile";

const svg = (box: string, body: string) => "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='${box}'>${body}</svg>`);
const item = (bg: string, body: string) => svg("0 0 120 150", `<rect width='120' height='150' fill='${bg}'/><g transform='translate(0 14)'>${body}</g>`);

const PRODUCTS: ProductCardProduct[] = [
  {
    id: "shirt",
    title: "Linen shirt",
    subtitle: "Shirts",
    href: "#",
    image: { src: item("#e9e5dc", "<path d='M42 26l-22 12 8 18 12-6v46h48V50l12 6 8-18-22-12c-4 8-10 12-18 12s-14-4-18-12z' fill='#9a8f7a'/><path d='M60 38v68' stroke='#867b66' stroke-width='2'/>"), alt: "Linen shirt in stone", width: 400, height: 500 },
    price: "€48.00",
    badge: "New",
  },
  {
    id: "scarf",
    title: "Merino scarf",
    subtitle: "Knitwear",
    href: "#",
    image: { src: item("#dde1e7", "<rect x='36' y='18' width='26' height='84' rx='9' fill='#3f4859'/><rect x='58' y='30' width='26' height='72' rx='9' fill='#566074'/><path d='M40 96v10M47 96v10M54 96v10M62 96v10M69 96v10M76 96v10' stroke='#3f4859' stroke-width='2.5' stroke-linecap='round'/>"), alt: "Merino scarf in ink", width: 400, height: 500 },
    price: "€59.00",
    compareAtPrice: "€79.00",
    badge: "-25%",
  },
  {
    id: "mug",
    title: "Stoneware mug",
    subtitle: "Kitchen",
    href: "#",
    image: { src: item("#efe8df", "<path d='M32 42h46v34a16 16 0 0 1-16 16H48a16 16 0 0 1-16-16z' fill='#c4694a'/><path d='M78 50h6a11 11 0 0 1 0 22h-6' fill='none' stroke='#c4694a' stroke-width='6'/><ellipse cx='55' cy='42' rx='23' ry='5' fill='#a5533a'/>"), alt: "Stoneware mug in clay", width: 400, height: 500 },
    price: "€18.00",
  },
];

/* A still life with the subject high and to the right, so the plate has calm wall to sit on. */
const AUTUMN = {
  src: svg(
    "0 0 960 600",
    [
      "<rect width='960' height='600' fill='#ead8bb'/>",
      "<rect y='470' width='960' height='130' fill='#cfae85'/>",
      "<path d='M600 470V212a110 110 0 0 1 220 0V470z' fill='#f7ecd6'/>",
      "<path d='M622 470V214a88 88 0 0 1 176 0V470z' fill='#fcf5e6'/>",
      "<circle cx='710' cy='262' r='50' fill='#e9a45b'/>",
      "<path d='M622 470v-52c34-30 62-12 88-26s52-22 88 8v70z' fill='#dcc08f'/>",
      "<rect x='366' y='420' width='16' height='150' fill='#6f4530'/><rect x='838' y='420' width='16' height='150' fill='#6f4530'/>",
      "<rect x='330' y='396' width='560' height='24' rx='5' fill='#8a5a3b'/>",
      "<rect x='628' y='366' width='150' height='30' rx='8' fill='#f2eadb'/>",
      "<rect x='636' y='338' width='134' height='30' rx='8' fill='#e5d8c1'/>",
      "<rect x='644' y='310' width='118' height='30' rx='8' fill='#f8f1e5'/>",
      "<path d='M646 325h114M638 353h130' stroke='#d6c8ae' stroke-width='2'/>",
      "<path d='M470 266C468 200 450 150 420 104M470 266C476 190 492 140 520 92M470 266C456 214 420 180 372 160M470 266C490 220 530 190 574 176M470 266C470 210 470 160 472 110' fill='none' stroke='#b4763f' stroke-width='4' stroke-linecap='round'/>",
      "<g fill='#c98a47'><ellipse cx='419' cy='100' rx='6' ry='13'/><ellipse cx='521' cy='88' rx='6' ry='13'/><ellipse cx='368' cy='158' rx='13' ry='6'/><ellipse cx='578' cy='174' rx='13' ry='6'/><ellipse cx='472' cy='106' rx='6' ry='13'/></g>",
      "<ellipse cx='470' cy='347' rx='46' ry='52' fill='#8d4f34'/>",
      "<rect x='456' y='266' width='28' height='46' rx='10' fill='#8d4f34'/>",
      "<ellipse cx='470' cy='267' rx='18' ry='5' fill='#6f3b26'/>",
      "<ellipse cx='452' cy='334' rx='8' ry='24' fill='#ffffff26'/>",
    ].join(""),
  ),
  position: "55% 50%",
};

const GIFTS = {
  src: svg(
    "0 0 600 720",
    [
      "<rect width='600' height='720' fill='#6c7c63'/>",
      "<circle cx='470' cy='150' r='170' fill='#7a8a70'/>",
      "<circle cx='90' cy='640' r='200' fill='#5d6d55'/>",
      "<rect x='140' y='300' width='320' height='230' rx='14' fill='#efe7d6'/>",
      "<rect x='116' y='262' width='368' height='64' rx='12' fill='#e3d8c2'/>",
      "<rect x='272' y='262' width='56' height='268' fill='#c1693f'/>",
      "<path d='M300 262c-50-70-130-70-130-18 0 34 70 30 130 18zM300 262c50-70 130-70 130-18 0 34-70 30-130 18z' fill='#d27a4d'/>",
      "<ellipse cx='300' cy='548' rx='170' ry='12' fill='#00000022'/>",
    ].join(""),
  ),
};

export default function Demo(): React.JSX.Element {
  const [shirt, scarf, mug] = PRODUCTS as [ProductCardProduct, ProductCardProduct, ProductCardProduct];
  return (
    <div className="grid w-full max-w-4xl grid-cols-1 gap-10">
      <div className="grid grid-cols-[minmax(0,1fr)] gap-3">
        <p className="text-xs text-muted-foreground">Promo tiles between products: they take the height of the row, and the wide one takes two columns from the sm breakpoint up</p>
        <div className="grid grid-flow-dense grid-cols-1 gap-4 sm:grid-cols-3">
          <ProductCard product={shirt} />
          <ProductCard product={scarf} />
          <PromoTile tone="inverted" title="Gift sets, wrapped" description="Three ready-made sets from €35." image={GIFTS} href="#" cta="Choose a set" badge="Limited" />
          <PromoTile span={2} title="The autumn linen edit" description="Shirts, throws and table linen, up to 30% off until Sunday." image={AUTUMN} href="#" cta="Shop the edit" badge="New season" />
          <ProductCard product={mug} />
        </div>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-3">
        <p className="text-xs text-muted-foreground">On a phone with two products across, the tile fills its own column and never runs into the next one</p>
        <div className="grid max-w-sm grid-flow-dense grid-cols-2 gap-3">
          <ProductCard product={shirt} />
          <ProductCard product={scarf} />
          <PromoTile tone="inverted" title="Gift sets" description="From €35." image={GIFTS} href="#" cta="Shop" badge="Limited" />
          <ProductCard product={mug} />
        </div>
      </div>
    </div>
  );
}
