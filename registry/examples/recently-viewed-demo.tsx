import { RecentlyViewed } from "@rhs-ui/commerce/recently-viewed";

const art = (fill: string, shape: string) => "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'><rect width='400' height='400' fill='${fill}'/>${shape}</svg>`);

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-5xl p-8">
      <RecentlyViewed
        clear={<button type="button" className="underline underline-offset-4 hover:text-foreground">Clear</button>}
        products={[
          { id: "1", title: "Stoneware mug", price: { amount: 2400, currency: "EUR" }, href: "#mug", image: { src: art("#e4e0d8", "<rect x='120' y='130' width='150' height='170' rx='18' fill='#8b8377'/>"), alt: "Stoneware mug" } },
          { id: "2", title: "Linen apron", price: { amount: 3900, currency: "EUR" }, href: "#apron", image: { src: art("#dedad2", "<path d='M130 110h140l30 240H100z' fill='#5d5850'/>"), alt: "Linen apron" } },
          { id: "3", title: "Canvas tote", price: { amount: 2900, currency: "EUR" }, href: "#tote", image: { src: art("#ebe8e1", "<rect x='110' y='150' width='180' height='190' rx='8' fill='#a49d90'/>"), alt: "Canvas tote" } },
          { id: "4", title: "Coffee beans, 500 g", price: { amount: 1895, currency: "EUR" }, href: "#beans", image: { src: art("#d7d1c6", "<ellipse cx='200' cy='200' rx='80' ry='110' fill='#4b4036'/>"), alt: "Bag of coffee beans" } },
          { id: "5", title: "Oak tray", price: { amount: 4500, currency: "EUR" }, href: "#tray", image: { src: art("#cbbfae", "<rect x='80' y='170' width='240' height='60' rx='12' fill='#8a6f52'/>"), alt: "Oak tray" } },
          { id: "6", title: "Wool throw", price: { amount: 8900, currency: "EUR" }, href: "#throw", image: { src: art("#b9b3a9", "<path d='M90 120h220v170H90z' fill='#6b645a'/>"), alt: "Wool throw" } },
        ]}
      />
    </div>
  );
}
