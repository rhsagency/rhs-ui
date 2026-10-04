import { IconHexagon } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { CustomerStory } from "@rhs-ui/marketing/customer-story";

const photo = "data:image/svg+xml;utf8," + encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 800'><rect width='600' height='800' fill='#4a4d52'/><circle cx='300' cy='300' r='110' fill='#c9c3b7'/><path d='M120 800 Q300 470 480 800Z' fill='#8d877c'/></svg>");

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <CustomerStory
        company="Fieldwork"
        logo={<IconHexagon />}
        quote="We stopped asking where things stood. The answer is just there, and our Mondays went back to design."
        name="Mara Lindqvist"
        role="Head of Design"
        photo={<img src={photo} alt="Mara Lindqvist in the Fieldwork studio" />}
        results={[
          { value: "6 h", label: "saved per designer, weekly" },
          { value: "3", label: "tools replaced" },
          { value: "98%", label: "of projects on time" },
        ]}
        action={<Button variant="outline">Read the story</Button>}
      />
    </div>
  );
}
