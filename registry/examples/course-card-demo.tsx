import type { ReactNode } from "react";

import { CourseCard } from "@rhs-ui/commerce/course-card";

const cover = (background: string, body: string) => "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 450'><rect width='800' height='450' fill='${background}'/>${body}</svg>`);

/** Four covers drawn in flat shapes, so the demo needs no pictures. */
const DATA = cover(
  "#e7e4dc",
  "<rect x='120' y='70' width='560' height='310' rx='18' fill='#fbfaf7'/><rect x='120' y='70' width='560' height='46' rx='18' fill='#2d2c29'/><rect x='150' y='150' width='150' height='200' rx='10' fill='#ebe8e0'/>" +
    "<path d='M330 330V250l60-50 60 30 70-80 60 40v160z' fill='#c9c4b7'/><path d='M330 250l60-50 60 30 70-80 60 40' fill='none' stroke='#2d2c29' stroke-width='6' stroke-linejoin='round' stroke-linecap='round'/><circle cx='148' cy='93' r='6' fill='#8a8678'/><circle cx='170' cy='93' r='6' fill='#8a8678'/>",
);
const TYPE = cover(
  "#2c2d30",
  "<text x='120' y='290' font-family='Georgia, serif' font-size='230' fill='#f1efe9'>Aa</text><rect x='500' y='130' width='170' height='12' rx='6' fill='#8e9096'/><rect x='500' y='166' width='130' height='12' rx='6' fill='#5d6066'/><rect x='500' y='202' width='150' height='12' rx='6' fill='#5d6066'/><rect x='500' y='238' width='90' height='12' rx='6' fill='#5d6066'/>",
);
const FORMS = cover(
  "#dde3e5",
  "<rect x='170' y='80' width='460' height='290' rx='20' fill='#f6f8f8'/><rect x='210' y='122' width='120' height='12' rx='6' fill='#6f7d84'/><rect x='210' y='146' width='380' height='44' rx='10' fill='#ffffff' stroke='#b4c0c5' stroke-width='3'/>" +
    "<rect x='210' y='214' width='90' height='12' rx='6' fill='#6f7d84'/><rect x='210' y='238' width='380' height='44' rx='10' fill='#ffffff' stroke='#2d3a40' stroke-width='5'/><rect x='210' y='304' width='140' height='42' rx='10' fill='#2d3a40'/>",
);
const PROTO = cover(
  "#ebe6df",
  "<path d='M200 225h120M440 225h120M380 150l-60 75M380 300l-60-75' stroke='#3d3a34' stroke-width='5' fill='none'/><rect x='110' y='185' width='130' height='80' rx='14' fill='#fbfaf7' stroke='#3d3a34' stroke-width='5'/><rect x='320' y='110' width='130' height='80' rx='14' fill='#3d3a34'/><rect x='320' y='260' width='130' height='80' rx='14' fill='#fbfaf7' stroke='#3d3a34' stroke-width='5'/><rect x='560' y='185' width='130' height='80' rx='14' fill='#c7bfae'/>",
);

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] grid-rows-[auto_1fr] gap-3">
      {/* Two lines tall in a two-column row, so a short caption does not lift its card above the one beside it. */}
      <p className="text-xs text-muted-foreground @xl:min-h-8">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="@container w-full max-w-3xl min-w-0">
      <div className="grid grid-cols-1 gap-x-6 gap-y-10 @xl:grid-cols-2">
        <Example caption="In the catalogue: level, length, rating and a price with its discount in words">
          <CourseCard
            href="#data-interfaces"
            title="Designing data-intensive interfaces"
            cover={{ src: DATA, alt: "" }}
            instructor={{ name: "Marit de Vries" }}
            level="intermediate"
            duration={390}
            lessons={42}
            rating={4.8}
            ratingCount={1284}
            price={4999}
            compareAtPrice={7999}
            badge="Bestseller"
          />
        </Example>

        <Example caption="Enrolled: the price gives way to progress and Continue. The whole card is still one link">
          <CourseCard
            href="#typography"
            title="Typography for product teams"
            cover={{ src: TYPE, alt: "" }}
            instructor={{ name: "Jonas Kessler" }}
            level="beginner"
            duration={225}
            lessons={18}
            rating={4.7}
            ratingCount={903}
            progress={45}
          />
        </Example>

        <Example caption="Free, and the hardest level: three bars filled">
          <CourseCard
            href="#forms"
            title="Accessible forms in an afternoon"
            cover={{ src: FORMS, alt: "" }}
            instructor={{ name: "Aisha Rahman" }}
            level="advanced"
            duration={150}
            lessons={9}
            rating={4.9}
            ratingCount={211}
            price={0}
          />
        </Example>

        <Example caption="Finished: it says so, and the action becomes Review">
          <CourseCard
            href="#prototyping"
            title="Prototyping with real data"
            cover={{ src: PROTO, alt: "" }}
            instructor={{ name: "Tomas Lindqvist" }}
            level="intermediate"
            duration={310}
            lessons={26}
            rating={4.6}
            ratingCount={1760}
            progress={100}
          />
        </Example>
      </div>
    </div>
  );
}
