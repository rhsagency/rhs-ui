import { ProductBadges } from "@rhs-ui/commerce/product-badges";

const mug = "data:image/svg+xml;utf8," + encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'><rect width='400' height='400' fill='#e4e0d8'/><rect x='120' y='130' width='150' height='170' rx='18' fill='#8b8377'/><path d='M270 170 q60 0 60 50 t-60 50' fill='none' stroke='#8b8377' stroke-width='18'/></svg>");

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto grid max-w-2xl gap-8 p-8 sm:grid-cols-2">
      <div className="relative">
        <img src={mug} alt="Stoneware mug" className="aspect-square w-full rounded-2xl object-cover" />
        <ProductBadges className="absolute top-3 left-3" badges={[{ kind: "new" }, { kind: "sale", label: "−30%" }]} />
      </div>
      <div className="flex flex-col justify-center gap-4">
        <ProductBadges layout="row" badges={[{ kind: "bestseller" }, { kind: "eco" }, { kind: "limited" }]} />
        <ProductBadges layout="row" badges={[{ kind: "sold-out" }]} />
      </div>
    </div>
  );
}
