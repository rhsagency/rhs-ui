import { Button } from "@rhs-ui/primitives/button";
import { CtaImageBand } from "@rhs-ui/marketing/cta-image-band";

const photo = "data:image/svg+xml;utf8," + encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 500'><rect width='1200' height='500' fill='#7b8a7a'/><path d='M0 380 300 220 520 330 780 160 1200 360V500H0z' fill='#4f5d4e'/><circle cx='980' cy='110' r='60' fill='#e8e2c8'/></svg>");

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6">
      <CtaImageBand
        title="Your next trip starts with one question."
        description="Tell us where you want to go. We plan the route, the stays and the quiet places in between."
        actions={<><Button size="lg" className="bg-white text-neutral-900 hover:bg-white/90">Plan my trip</Button><Button size="lg" variant="ghost" className="text-white hover:bg-white/10 hover:text-white">See routes</Button></>}
        image={<img src={photo} alt="" />}
      />
    </div>
  );
}
