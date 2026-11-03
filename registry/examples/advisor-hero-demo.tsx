import { IconAward, IconBriefcase, IconLanguage } from "@rhs-ui/icons";
import { AdvisorHero } from "@rhs-ui/marketing/advisor-hero";

interface Look {
  wall: string;
  light: string;
  jacket: string;
  lapel: string;
  shirt: string;
  skin: string;
  shade: string;
  hair: string;
  hairStyle: "bob" | "short";
}

/* Portraits drawn for the demo, so they need no files. In your site: a real photograph, four by five, with the face in the upper half. */
function portrait(look: Look): string {
  const hairBack =
    look.hairStyle === "bob"
      ? `<path d='M262 520C250 350 320 290 400 290S550 350 538 520V600Q538 642 498 642H302Q262 642 262 600Z' fill='${look.hair}'/>`
      : "";
  const hairFront =
    look.hairStyle === "bob"
      ? `<path d='M280 474C288 380 340 346 412 350C474 354 512 398 520 474C494 432 452 410 402 412C352 412 308 432 280 474Z' fill='${look.hair}'/>`
      : `<path d='M282 476C272 362 332 314 402 314S528 362 518 476C500 424 462 398 400 398S300 424 282 476Z' fill='${look.hair}'/>`;
  const art = [
    `<rect width='800' height='1000' fill='${look.wall}'/>`,
    `<rect x='430' width='370' height='1000' fill='${look.light}'/>`,
    `<circle cx='620' cy='210' r='130' fill='${look.wall}' opacity='.55'/>`,
    `<circle cx='700' cy='420' r='70' fill='${look.wall}' opacity='.45'/>`,
    `<circle cx='150' cy='300' r='90' fill='${look.light}' opacity='.5'/>`,
    hairBack,
    `<path d='M40 1000C40 840 130 762 290 730L510 730C670 762 760 840 760 1000Z' fill='${look.jacket}'/>`,
    `<path d='M316 730L400 872L484 730Z' fill='${look.shirt}'/>`,
    `<path d='M290 730L392 906L330 742Z' fill='${look.lapel}'/><path d='M510 730L408 906L470 742Z' fill='${look.lapel}'/>`,
    `<path d='M352 636h96v96c-22 28-74 28-96 0z' fill='${look.skin}'/>`,
    `<path d='M352 690q48 40 96 0v32c-22 28-74 28-96 0z' fill='${look.shade}' opacity='.55'/>`,
    `<ellipse cx='283' cy='510' rx='19' ry='32' fill='${look.skin}'/><ellipse cx='517' cy='510' rx='19' ry='32' fill='${look.skin}'/>`,
    `<ellipse cx='400' cy='500' rx='118' ry='148' fill='${look.skin}'/>`,
    hairFront,
    `<ellipse cx='352' cy='510' rx='9' ry='6.5' fill='#2a2320'/><ellipse cx='448' cy='510' rx='9' ry='6.5' fill='#2a2320'/>`,
    `<path d='M328 484q24-15 48-4M424 480q24-11 48 4' stroke='${look.hair}' stroke-width='7' stroke-linecap='round' fill='none'/>`,
    `<path d='M402 524q-13 38 4 50' stroke='${look.shade}' stroke-width='7' stroke-linecap='round' stroke-linejoin='round' fill='none'/>`,
    `<path d='M362 594q38 26 76 0' stroke='#a35b4b' stroke-width='8' stroke-linecap='round' fill='none'/>`,
    `<circle cx='334' cy='560' r='20' fill='${look.shade}' opacity='.28'/><circle cx='466' cy='560' r='20' fill='${look.shade}' opacity='.28'/>`,
  ].join("");
  return "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 1000'>${art}</svg>`);
}

const maren = portrait({ wall: "#d3cdc1", light: "#e6e1d6", jacket: "#2b3238", lapel: "#394148", shirt: "#f3efe7", skin: "#d8aa88", shade: "#b4805f", hair: "#3a2c26", hairStyle: "bob" });
const jonas = portrait({ wall: "#c9cdcb", light: "#dde0de", jacket: "#46505a", lapel: "#56616c", shirt: "#eceae4", skin: "#e0b995", shade: "#bd8d68", hair: "#8a6b47", hairStyle: "short" });

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6">
      <p className="pt-6 text-xs text-muted-foreground">With a status pill over the portrait, the next free slot, a phone number and a line from a client.</p>
      <AdvisorHero
        className="py-8 sm:py-10 lg:py-12"
        name="Maren de Wit"
        role="Tax lawyer and partner at Kestrel & Vos"
        portrait={{ src: maren, alt: "Maren de Wit in a dark blazer, smiling at the camera", width: 800, height: 1000 }}
        availability="Accepting new clients"
        promise="I help owner-managed companies keep more of what they earn, without surprises from the tax office."
        credentials={[
          { icon: <IconBriefcase />, label: "18 years in practice" },
          { icon: <IconAward />, label: "Certified tax adviser" },
          { icon: <IconLanguage />, label: "Dutch, English and German" },
        ]}
        cta={{ label: "Book a 30-minute intro call", href: "#book" }}
        nextSlot={{ dateTime: "2026-11-05T10:00", label: "Thursday 10:00" }}
        phone="020 555 0138"
        quote={{ text: "Maren found 40,000 euros in deductions our previous adviser had missed.", author: "Noor Bakker, founder of Polder Foods" }}
      />

      <p className="border-t border-border pt-6 text-xs text-muted-foreground">Only what is needed: the person, the promise, three facts and the one link.</p>
      <AdvisorHero
        className="py-8 sm:py-10 lg:py-12"
        name="Jonas Eriksen"
        role="Leadership coach"
        portrait={{ src: jonas, alt: "Jonas Eriksen in a grey jacket, looking at the camera", width: 800, height: 1000 }}
        promise="I coach first-time managers through their first year, so the team grows and the manager stays."
        credentials={[
          { icon: <IconBriefcase />, label: "12 years coaching managers" },
          { icon: <IconAward />, label: "Accredited by the Halcyon Coaching Institute" },
          { icon: <IconLanguage />, label: "English and Swedish" },
        ]}
        cta={{ label: "Book a free intro call", href: "#book" }}
      />
    </div>
  );
}
