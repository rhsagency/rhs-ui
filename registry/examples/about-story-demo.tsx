import { AboutStory } from "@rhs-ui/marketing/about-story";

/** A roastery drawn in flat tones: an arched window, its light on the floor, sacks and the roaster. */
const ROASTERY =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 1000'>" +
      "<rect width='800' height='1000' fill='#d9d3c7'/>" +
      "<rect y='770' width='800' height='230' fill='#b9b0a0'/>" +
      "<path d='M210 770L590 770L780 1000H20Z' fill='#c6bdac'/>" +
      "<path d='M170 770V400a230 230 0 0 1 460 0V770Z' fill='#f4f0e7'/>" +
      "<path d='M400 170V770M170 480H630' stroke='#d9d3c7' stroke-width='12' fill='none'/>" +
      "<path d='M170 770V400a230 230 0 0 1 460 0V770Z' fill='none' stroke='#cbc3b3' stroke-width='14'/>" +
      "<rect x='566' y='560' width='200' height='226' rx='16' fill='#3a3d42'/>" +
      "<path d='M604 560H730L770 462H566Z' fill='#2b2d31'/>" +
      "<rect x='652' y='292' width='26' height='172' fill='#2b2d31'/>" +
      "<circle cx='666' cy='656' r='38' fill='#8f939a'/><circle cx='666' cy='656' r='24' fill='#d9d3c7'/><path d='M666 656l14-12' stroke='#2b2d31' stroke-width='5' stroke-linecap='round'/>" +
      "<rect x='590' y='724' width='152' height='10' rx='5' fill='#5b6068'/>" +
      "<path d='M44 786q-14-120 44-142q62-22 112 0q58 22 44 142Z' fill='#a8967a'/><path d='M104 656h72' stroke='#7f6f57' stroke-width='9' stroke-linecap='round'/>" +
      "<path d='M236 786q-10-84 30-100q44-16 80 0q40 16 30 100Z' fill='#bba98c'/><path d='M284 688h50' stroke='#8d7c61' stroke-width='8' stroke-linecap='round'/>" +
      "</svg>",
  );

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6">
      <AboutStory
        eyebrow="Our story"
        statement="We roast coffee the way we wish we had been taught to cook: slowly, with attention, and without pretending it is simple."
        paragraphs={[
          "Polder started in 2014 in a rented garage in Utrecht, with a second-hand roaster that needed forty minutes to warm up and a stubborn idea: good coffee should be explained, not whispered.",
          "We buy from farms we have visited, pay what they ask and publish what we paid. Every bag carries the harvest date, the farm and the roast profile, because the people who drink it are smart enough to want to know.",
          "Today we are 38 people across three roasteries, supplying cafés from Groningen to Ghent. We are still the kind of company where the person who roasted your coffee will answer your email.",
        ]}
        image={{ src: ROASTERY, alt: "A roastery in soft morning light: a tall arched window, sacks of green coffee and the roaster in the corner", caption: "The Utrecht roastery on a Monday morning, before the first batch." }}
        signature={{ name: "Marit Bosch", role: "co-founder" }}
        action={{ label: "Meet the team", href: "#team" }}
        facts={[
          { label: "Founded", value: "2014" },
          { label: "People", value: "38" },
          { label: "Roasteries", value: "3" },
          { label: "Cafés we supply", value: "1,200+" },
        ]}
      />
    </div>
  );
}
