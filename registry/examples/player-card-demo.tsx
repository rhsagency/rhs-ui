import type { ReactNode } from "react";

import { PlayerCard } from "@rhs-ui/application/player-card";

/** A look for the drawn portraits below. */
interface Look {
  bg: string;
  halo: string;
  skin: string;
  shade: string;
  hair: string;
  shirt: string;
  trim: string;
  style: "crop" | "long" | "curly" | "bun";
  beard?: boolean;
}

/** Portraits drawn in flat shapes for players who do not exist, so the demo needs no files. Use real photographs in an app. */
const portrait = (look: Look) => {
  const curls = Array.from({ length: 11 }, (_, i) => {
    const angle = Math.PI + (i / 10) * Math.PI;
    return `<circle cx='${200 + Math.cos(angle) * 66}' cy='${222 + Math.sin(angle) * 78}' r='${i % 2 ? 24 : 28}' fill='${look.hair}'/>`;
  }).join("");
  const hair = {
    crop: `<path d='M134 240C130 168 168 142 200 142C238 142 270 170 266 240C256 206 236 190 200 190C164 190 144 206 134 240Z' fill='${look.hair}'/>`,
    long: `<path d='M134 240C130 168 168 142 200 142C238 142 270 170 266 240C256 206 236 190 200 190C164 190 144 206 134 240Z' fill='${look.hair}'/><path d='M133 236C108 300 116 362 148 398L174 346L152 250Z' fill='${look.hair}'/><path d='M267 236C292 300 284 362 252 398L226 346L248 250Z' fill='${look.hair}'/>`,
    curly: curls,
    bun: `<path d='M134 240C130 168 168 142 200 142C238 142 270 170 266 240C256 206 236 190 200 190C164 190 144 206 134 240Z' fill='${look.hair}'/><circle cx='200' cy='124' r='26' fill='${look.hair}'/>`,
  }[look.style];
  const beard = look.beard ? `<path d='M138 268C142 332 170 348 200 348C230 348 258 332 262 268C250 302 232 314 200 314C168 314 150 302 138 268Z' fill='${look.hair}'/>` : "";
  return (
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 500'>` +
        `<rect width='400' height='500' fill='${look.bg}'/><circle cx='200' cy='238' r='170' fill='${look.halo}'/>` +
        `<path d='M24 520C24 408 98 370 200 370C302 370 376 408 376 520Z' fill='${look.shirt}'/>` +
        `<path d='M70 520C72 470 78 440 92 412L112 420C100 446 96 480 96 520Z' fill='${look.trim}' opacity='.9'/><path d='M330 520C328 470 322 440 308 412L288 420C300 446 304 480 304 520Z' fill='${look.trim}' opacity='.9'/>` +
        `<path d='M168 316h64v64q-32 24 -64 0z' fill='${look.shade}'/>` +
        `<path d='M148 374C164 414 236 414 252 374L240 368C228 396 172 396 160 368Z' fill='${look.trim}'/>` +
        `<ellipse cx='136' cy='256' rx='9' ry='16' fill='${look.skin}'/><ellipse cx='264' cy='256' rx='9' ry='16' fill='${look.skin}'/>` +
        `<ellipse cx='200' cy='250' rx='64' ry='80' fill='${look.skin}'/>` +
        beard +
        hair +
        `<path d='M192 262q8 12 16 0' fill='none' stroke='${look.shade}' stroke-width='4' stroke-linecap='round'/>` +
        `</svg>`,
    )
  );
};

const MILA = portrait({ bg: "#d6d0c2", halo: "#e6e1d4", skin: "#e5bc9b", shade: "#d0a381", hair: "#3b2a20", shirt: "#27364a", trim: "#efe8d8", style: "long" });
const TARIQ = portrait({ bg: "#cdd4d1", halo: "#dde3e0", skin: "#a0714f", shade: "#895b3c", hair: "#1d1a18", shirt: "#27364a", trim: "#efe8d8", style: "crop", beard: true });
const ELIAS = portrait({ bg: "#d9d1cc", halo: "#e8e1dc", skin: "#f0d0b6", shade: "#dcb797", hair: "#8a5a32", shirt: "#2c2e33", trim: "#b4634a", style: "bun" });

function Case({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col">
      <p className="mb-2.5 text-xs text-muted-foreground">{caption}</p>
      <div className="flex-1 [&>article]:h-full">{children}</div>
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-4xl grid-cols-2 items-stretch gap-x-4 gap-y-7 sm:gap-x-5 md:grid-cols-4">
      <Case caption="The captain">
        <PlayerCard
          name="Mila Kowalski"
          number={9}
          position="Forward"
          positionCode="FW"
          image={{ src: MILA, alt: "Mila Kowalski in the navy home kit" }}
          nationality="Poland"
          age={24}
          captain
          stats={[
            { label: "Apps", value: 18 },
            { label: "Goals", value: 11 },
            { label: "Assists", value: 4 },
          ]}
          href="#mila-kowalski"
        />
      </Case>

      <Case caption="Injured, with a return">
        <PlayerCard
          name="Tariq Aziz"
          number={4}
          position="Centre-back"
          positionCode="CB"
          image={{ src: TARIQ, alt: "Tariq Aziz in the navy home kit" }}
          nationality="Morocco"
          age={29}
          status="injured"
          returns="Back around 24 Nov"
          stats={[
            { label: "Apps", value: 12 },
            { label: "Tackles", value: 41 },
            { label: "Goals", value: 1 },
          ]}
          href="#tariq-aziz"
        />
      </Case>

      <Case caption="Suspended">
        <PlayerCard
          name="Elias Moreau"
          number={1}
          position="Goalkeeper"
          positionCode="GK"
          image={{ src: ELIAS, alt: "Elias Moreau in the charcoal goalkeeper kit" }}
          nationality="France"
          age={31}
          status="suspended"
          returns="Back after 2 matches"
          stats={[
            { label: "Apps", value: 19 },
            { label: "Saves", value: 64 },
            { label: "Shutouts", value: 7 },
          ]}
          href="#elias-moreau"
        />
      </Case>

      <Case caption="No photo yet">
        <PlayerCard
          name="Ruben Okoye"
          number={17}
          position="Winger"
          positionCode="RW"
          nationality="Nigeria"
          age={21}
          stats={[
            { label: "Apps", value: 9 },
            { label: "Goals", value: 2 },
            { label: "Assists", value: 3 },
          ]}
          href="#ruben-okoye"
        />
      </Case>
    </div>
  );
}
