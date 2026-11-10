import { InlineImageHero } from "@rhs-ui/marketing/inline-image-hero";

/* The pictures are drawn for the demo, so they need no files. In your site: crops of your own work, wider than high, with the subject near the middle. */
const picture = (art: string) => "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 420 200' preserveAspectRatio='xMidYMid slice'>${art}</svg>`);

// A poster: shapes in a Bauhaus balance.
const poster = picture(
  `<rect width='420' height='200' fill='#d9694a'/><circle cx='150' cy='108' r='84' fill='#f3e6cf'/><path d='M150 24a84 84 0 0 1 0 168z' fill='#1f1f1f' transform='translate(0 0)'/><rect x='262' y='40' width='92' height='120' rx='46' fill='#f2b84b'/><circle cx='308' cy='100' r='18' fill='#1f1f1f'/>`,
);

// An interface: a card with a chart, and a button.
const interfaceArt = picture(
  `<rect width='420' height='200' fill='#c7d3d6'/><rect x='64' y='28' width='292' height='144' rx='18' fill='#fbfaf6'/><rect x='88' y='52' width='84' height='10' rx='5' fill='#1f1f1f'/><rect x='88' y='72' width='132' height='7' rx='3.5' fill='#b8bcbc'/><rect x='88' y='128' width='36' height='24' rx='6' fill='#d9694a'/><rect x='132' y='108' width='36' height='44' rx='6' fill='#1f1f1f'/><rect x='176' y='90' width='36' height='62' rx='6' fill='#2f5d62'/><rect x='260' y='120' width='76' height='32' rx='16' fill='#1f1f1f'/><rect x='276' y='133' width='44' height='6' rx='3' fill='#fbfaf6'/>`,
);

// People: three figures in a row.
const people = picture(
  `<rect width='420' height='200' fill='#f0c25a'/>` +
    [[96, '#d9694a', '#3a2a22', '#2f5d62'], [210, '#f3e6cf', '#1f1f1f', '#d9694a'], [324, '#8a5a3c', '#1f1f1f', '#fbfaf6']]
      .map(([x, skin, hair, shirt]) => `<path d='M${Number(x) - 62} 220c0-52 28-70 62-70s62 18 62 70z' fill='${shirt}'/><circle cx='${x}' cy='98' r='34' fill='${skin}'/><path d='M${Number(x) - 34} 96a34 34 0 0 1 68 0c-14-16-30-22-34-22s-20 6-34 22z' fill='${hair}'/>`)
      .join(""),
);

// Type: a letterform on green.
const type = picture(
  `<rect width='420' height='200' fill='#254a3e'/><text x='210' y='150' text-anchor='middle' font-family="Georgia, 'Times New Roman', serif" font-size='150' font-style='italic' font-weight='700' fill='#f3e6cf'>Aa</text><circle cx='340' cy='52' r='12' fill='#f2b84b'/>`,
);

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6">
      <p className="pt-6 text-xs text-muted-foreground">The sentence is data: words and pictures in order. The pictures are decorative, so the heading reads as one plain sentence.</p>
      <InlineImageHero
        className="py-8 sm:py-10 lg:py-12"
        kicker="Independent design studio in Rotterdam"
        parts={["We design", { image: poster }, "brands and", { image: interfaceArt }, "products for", { image: people }, "people who care."]}
        meta={["Brand identity", "Product design", "Art direction", "Booking for 2027"]}
        cta={{ label: "Start a project", href: "#contact" }}
      />

      <p className="border-t border-border pt-6 text-xs text-muted-foreground">
        A shorter line, with one picture that stands for a word, so its alt is that word and the heading reads &ldquo;We make type that works for loud industries.&rdquo; The other picture only decorates. No facts.
      </p>
      <InlineImageHero
        className="py-8 sm:py-10 lg:py-12"
        parts={["We make", { image: type, alt: "type" }, "that works for", { image: interfaceArt, ratio: 1.6 }, "loud industries."]}
        cta={{ label: "See our work", href: "#work" }}
      />
    </div>
  );
}
