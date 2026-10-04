import { Button } from "@rhs-ui/primitives/button";
import { CollageHero } from "@rhs-ui/marketing/collage-hero";

const art = (fill: string, shape: string, w = 400, h = 500) => "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${w} ${h}'><rect width='${w}' height='${h}' fill='${fill}'/>${shape}</svg>`);

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6">
      <CollageHero
        eyebrow="Boxing school, Ede"
        title="Train hard. Stay humble. Come as you are."
        description="Classes for beginners and fighters, six days a week, with coaches who know your name."
        actions={<><Button size="lg">Book a free trial</Button><Button size="lg" variant="outline">Timetable</Button></>}
        images={[
          <img key="1" src={art("#2f3236", "<circle cx='200' cy='200' r='90' fill='#6f747b'/><rect x='120' y='300' width='160' height='160' rx='20' fill='#6f747b'/>")} alt="A coach holding pads in the gym" />,
          <img key="2" src={art("#d8d3c9", "<rect x='120' y='150' width='160' height='200' rx='30' fill='#8d877c'/>", 300, 300)} alt="Gloves on a bench" />,
          <img key="3" src={art("#bdb6aa", "<circle cx='150' cy='150' r='70' fill='#3a3c40'/>", 300, 300)} alt="A heavy bag" />,
        ]}
      />
    </div>
  );
}
