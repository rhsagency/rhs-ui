import { IconStar } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { ProductHero } from "@rhs-ui/marketing/product-hero";

const lamp = "data:image/svg+xml;utf8," + encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 500 400'><rect width='500' height='400' fill='#e9e6e0'/><path d='M250 60 L330 180 H170 Z' fill='#2c2e33'/><rect x='246' y='180' width='8' height='150' fill='#2c2e33'/><ellipse cx='250' cy='336' rx='70' ry='12' fill='#2c2e33'/><ellipse cx='250' cy='190' rx='110' ry='26' fill='#f6e7b8' opacity='.55'/></svg>");

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6">
      <ProductHero
        eyebrow="New, in three finishes"
        title="Aero, the lamp that dims by touch."
        description="Recycled aluminium, a linen shade and warm light that follows your evening."
        points={["Dims from 100% to a night light", "Five-year warranty", "Ships tomorrow, free returns"]}
        actions={
          <>
            <Button size="lg">Buy for €189</Button>
            <Button size="lg" variant="outline">See the finishes</Button>
          </>
        }
        note={<span className="inline-flex items-center gap-1.5"><IconStar className="size-3.5" /> 4.8 from 1,204 reviews</span>}
        visual={<img src={lamp} alt="Aero lamp in charcoal with a warm glow" />}
      />
    </div>
  );
}
