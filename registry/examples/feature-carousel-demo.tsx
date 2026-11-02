import type { ReactNode } from "react";

import { IconBell, IconEye, IconFileText, IconLayers, IconMoon, IconRefresh } from "@rhs-ui/icons";
import { FeatureCarousel, type CarouselFeature } from "@rhs-ui/marketing/feature-carousel";

/**
 * Pictures for the cards, drawn as inline SVG so the demo needs no files and the drawings follow the light or dark
 * theme: every shape takes its colour from a theme token. In a real page these are your own screenshots.
 */
const SURFACE = "fill-card stroke-border";
const SOFT = "fill-foreground/10";
const LINE = "fill-foreground/20";
const INK = "fill-foreground";
const WIRE = "fill-none stroke-foreground/30";

function Rect({ x, y, w, h, r = 4, className }: { x: number; y: number; w: number; h: number; r?: number; className: string }): React.JSX.Element {
  return <rect x={x} y={y} width={w} height={h} rx={r} className={className} />;
}

function Drawing({ children }: { children: ReactNode }): React.JSX.Element {
  return (
    <svg viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      {children}
    </svg>
  );
}

function Inbox(): React.JSX.Element {
  return (
    <Drawing>
      <Rect x={24} y={24} w={112} h={152} r={10} className={SURFACE} />
      <Rect x={32} y={34} w={96} h={40} r={6} className={SOFT} />
      <circle cx={48} cy={54} r={9} className="fill-foreground/70" />
      <Rect x={64} y={46} w={56} h={6} r={3} className={INK} />
      <Rect x={64} y={58} w={40} h={5} r={2.5} className={LINE} />
      <circle cx={48} cy={98} r={9} className="fill-foreground/25" />
      <Rect x={64} y={90} w={52} h={6} r={3} className={LINE} />
      <Rect x={64} y={102} w={36} h={5} r={2.5} className={SOFT} />
      <circle cx={48} cy={142} r={9} className="fill-foreground/25" />
      <Rect x={64} y={134} w={58} h={6} r={3} className={LINE} />
      <Rect x={64} y={146} w={30} h={5} r={2.5} className={SOFT} />
      <Rect x={148} y={24} w={148} h={152} r={10} className={SURFACE} />
      <Rect x={162} y={38} w={72} h={7} r={3.5} className={LINE} />
      <Rect x={256} y={36} w={28} h={11} r={5.5} className={SOFT} />
      <Rect x={162} y={62} w={92} h={30} r={9} className={SOFT} />
      <Rect x={172} y={72} w={64} h={5} r={2.5} className={LINE} />
      <Rect x={172} y={82} w={44} h={5} r={2.5} className={LINE} />
      <Rect x={192} y={100} w={92} h={30} r={9} className={INK} />
      <Rect x={202} y={110} w={64} h={5} r={2.5} className="fill-background/70" />
      <Rect x={202} y={120} w={40} h={5} r={2.5} className="fill-background/70" />
      <Rect x={162} y={142} w={122} h={22} r={8} className={SURFACE} />
      <Rect x={172} y={150} w={48} h={5} r={2.5} className={SOFT} />
    </Drawing>
  );
}

function Rules(): React.JSX.Element {
  return (
    <Drawing>
      <path d="M98 78h24M198 78h24M160 100v22" className={WIRE} strokeWidth={1.5} strokeLinecap="round" />
      <path d="M118 74l5 4-5 4M218 74l5 4-5 4M156 117l4 5 4-5" className={WIRE} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <Rect x={22} y={56} w={76} h={44} r={10} className={SURFACE} />
      <circle cx={40} cy={78} r={6} className={INK} />
      <Rect x={52} y={71} w={36} h={5} r={2.5} className={LINE} />
      <Rect x={52} y={81} w={24} h={4} r={2} className={SOFT} />
      <Rect x={122} y={56} w={76} h={44} r={10} className={SURFACE} />
      <circle cx={140} cy={78} r={6} className="fill-foreground/40" />
      <Rect x={152} y={71} w={36} h={5} r={2.5} className={LINE} />
      <Rect x={152} y={81} w={28} h={4} r={2} className={SOFT} />
      <Rect x={222} y={56} w={76} h={44} r={10} className={SURFACE} />
      <circle cx={240} cy={78} r={6} className="fill-foreground/40" />
      <Rect x={252} y={71} w={36} h={5} r={2.5} className={LINE} />
      <Rect x={252} y={81} w={22} h={4} r={2} className={SOFT} />
      <Rect x={122} y={126} w={76} h={44} r={10} className={SURFACE} />
      <circle cx={140} cy={148} r={6} className="fill-foreground/40" />
      <Rect x={152} y={141} w={36} h={5} r={2.5} className={LINE} />
      <Rect x={152} y={151} w={26} h={4} r={2} className={SOFT} />
    </Drawing>
  );
}

function Dashboard(): React.JSX.Element {
  const bars = [34, 52, 44, 68, 60, 86, 72, 104];
  return (
    <Drawing>
      <Rect x={24} y={24} w={272} h={152} r={10} className={SURFACE} />
      <Rect x={40} y={40} w={64} h={7} r={3.5} className={LINE} />
      <Rect x={40} y={54} w={40} h={5} r={2.5} className={SOFT} />
      <Rect x={232} y={40} w={48} h={12} r={6} className={SOFT} />
      {bars.map((height, index) => (
        <Rect key={index} x={44 + index * 30} y={160 - height} w={18} h={height} r={4} className={index === bars.length - 1 ? INK : "fill-foreground/15"} />
      ))}
      <Rect x={40} y={160} w={240} h={1} r={0} className="fill-border" />
    </Drawing>
  );
}

function Calendar(): React.JSX.Element {
  return (
    <Drawing>
      <Rect x={24} y={24} w={272} h={152} r={10} className={SURFACE} />
      {Array.from({ length: 7 }, (_, column) => (
        <Rect key={column} x={43 + column * 36} y={37} w={14} h={4} r={2} className={LINE} />
      ))}
      {Array.from({ length: 4 }, (_, row) =>
        Array.from({ length: 7 }, (_, column) => (
          <Rect key={`${row}-${column}`} x={36 + column * 36} y={50 + row * 31} w={30} h={25} r={5} className={column > 4 ? "fill-foreground/5" : SOFT} />
        )),
      )}
      <Rect x={72} y={58} w={66} h={7} r={3.5} className={INK} />
      <Rect x={144} y={89} w={96} h={7} r={3.5} className="fill-foreground/55" />
      <Rect x={36} y={120} w={60} h={7} r={3.5} className="fill-foreground/35" />
      <Rect x={180} y={151} w={66} h={7} r={3.5} className={INK} />
    </Drawing>
  );
}

function SignIn(): React.JSX.Element {
  return (
    <Drawing>
      <Rect x={78} y={20} w={164} h={160} r={12} className={SURFACE} />
      <circle cx={160} cy={46} r={12} className={SOFT} />
      <Rect x={96} y={68} w={128} h={22} r={7} className={SURFACE} />
      <circle cx={110} cy={79} r={4.5} className="fill-foreground/60" />
      <Rect x={122} y={76} w={52} h={5} r={2.5} className={LINE} />
      <Rect x={96} y={96} w={128} h={22} r={7} className={SURFACE} />
      <circle cx={110} cy={107} r={4.5} className="fill-foreground/60" />
      <Rect x={122} y={104} w={44} h={5} r={2.5} className={LINE} />
      <Rect x={96} y={126} w={50} h={1} r={0} className="fill-border" />
      <Rect x={174} y={126} w={50} h={1} r={0} className="fill-border" />
      <Rect x={96} y={140} w={128} h={26} r={7} className={INK} />
      <Rect x={134} y={150} w={52} h={5} r={2.5} className="fill-background/70" />
    </Drawing>
  );
}

function Code(): React.JSX.Element {
  const lines: [number, number, number, number][] = [
    [40, 58, 30, 6],
    [78, 58, 74, 6],
    [52, 74, 112, 6],
    [52, 90, 84, 6],
    [52, 106, 136, 6],
    [52, 122, 64, 6],
    [40, 138, 20, 6],
  ];
  return (
    <Drawing>
      <Rect x={24} y={24} w={272} h={152} r={10} className={INK} />
      <circle cx={40} cy={40} r={3.5} className="fill-background/35" />
      <circle cx={53} cy={40} r={3.5} className="fill-background/35" />
      <circle cx={66} cy={40} r={3.5} className="fill-background/35" />
      {lines.map(([x, y, w, h], index) => (
        <Rect key={index} x={x} y={y} w={w} h={h} r={3} className={index === 1 || index === 4 ? "fill-background/90" : "fill-background/40"} />
      ))}
      <Rect x={198} y={90} w={58} h={6} r={3} className="fill-background/90" />
    </Drawing>
  );
}

function Board(): React.JSX.Element {
  return (
    <Drawing>
      {[24, 116, 208].map((x, column) => (
        <g key={x}>
          <Rect x={x} y={24} w={88} h={152} r={10} className={SURFACE} />
          <Rect x={x + 12} y={38} w={36} h={6} r={3} className={LINE} />
          <Rect x={x + 8} y={56} w={72} h={34} r={7} className={SOFT} />
          <Rect x={x + 16} y={66} w={48} h={5} r={2.5} className={column === 1 ? INK : LINE} />
          <Rect x={x + 16} y={77} w={30} h={5} r={2.5} className={SOFT} />
          {column !== 2 ? (
            <>
              <Rect x={x + 8} y={98} w={72} h={34} r={7} className={SOFT} />
              <Rect x={x + 16} y={108} w={40} h={5} r={2.5} className={LINE} />
              <Rect x={x + 16} y={119} w={26} h={5} r={2.5} className={SOFT} />
            </>
          ) : null}
          {column === 0 ? <Rect x={x + 8} y={140} w={72} h={26} r={7} className={SOFT} /> : null}
        </g>
      ))}
    </Drawing>
  );
}

function Phone(): React.JSX.Element {
  return (
    <Drawing>
      <Rect x={104} y={14} w={112} h={184} r={20} className={SURFACE} />
      <Rect x={146} y={24} w={28} h={6} r={3} className={SOFT} />
      <Rect x={120} y={46} w={52} h={7} r={3.5} className={INK} />
      {[0, 1, 2].map((row) => (
        <g key={row}>
          <circle cx={130} cy={78 + row * 34} r={9} className={row === 0 ? "fill-foreground/60" : "fill-foreground/20"} />
          <Rect x={146} y={70 + row * 34} w={56} h={6} r={3} className={LINE} />
          <Rect x={146} y={81 + row * 34} w={38} h={5} r={2.5} className={SOFT} />
        </g>
      ))}
      <Rect x={104} y={164} w={112} h={1} r={0} className="fill-border" />
      <circle cx={136} cy={181} r={4} className={INK} />
      <circle cx={160} cy={181} r={4} className="fill-foreground/25" />
      <circle cx={184} cy={181} r={4} className="fill-foreground/25" />
    </Drawing>
  );
}

const TOUR: CarouselFeature[] = [
  { id: "inboxes", image: <Inbox />, title: "Shared inboxes", description: "One inbox for every conversation, with an owner on each thread.", href: "#inboxes" },
  { id: "rules", image: <Rules />, title: "Rules and automation", description: "Route, tag and reply to routine work without writing a line of code.", href: "#rules" },
  { id: "dashboards", image: <Dashboard />, title: "Dashboards", description: "The numbers your team checks, pinned where they will see them.", href: "#dashboards" },
  { id: "calendar", image: <Calendar />, title: "Team calendar", description: "See who is out and where the week is tight before you plan it.", href: "#calendar" },
  { id: "sso", image: <SignIn />, title: "Single sign-on", description: "Sign in with your identity provider and manage access in one place.", href: "#sso" },
  { id: "api", image: <Code />, title: "API and webhooks", description: "Read, write and listen to everything the app can do.", href: "#api" },
  { id: "boards", image: <Board />, title: "Boards and views", description: "The same work as a list, a board or a timeline, whichever you think in.", href: "#boards" },
  { id: "mobile", image: <Phone />, title: "Mobile apps", description: "Triage from your phone and pick up where you left off on your laptop.", href: "#mobile" },
];

const LATEST: CarouselFeature[] = [
  { id: "guests", icon: <IconEye />, title: "Guest access", description: "Invite a client to one project. They see their work and nothing else.", href: "#guests" },
  { id: "documents", icon: <IconFileText />, title: "Live documents", description: "Write specs beside the tasks they describe, with changes tracked.", href: "#documents" },
  { id: "retries", icon: <IconRefresh />, title: "Webhook retries", description: "Failed deliveries try again for 24 hours, and you can replay them.", href: "#retries" },
  { id: "dark", icon: <IconMoon />, title: "Dark mode", description: "Follows your system, or stays on whichever you choose.", href: "#dark" },
  { id: "bulk", icon: <IconLayers />, title: "Bulk edit", description: "Change the owner, date or status of fifty tasks in one go.", href: "#bulk" },
  { id: "digests", icon: <IconBell />, title: "Quieter notifications", description: "Group updates into a digest and keep the pings for what is yours.", href: "#digests" },
];

/**
 * `gutter` sets --page-gutter for the carousel inside: the side padding of the page where the block reaches it, and 0 where
 * the page has margin to spare, so on a phone the row runs off the edge of the screen and on a desktop it ends with the column.
 */
function Example({ caption, gutter, children }: { caption: string; gutter: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className={`min-w-0 ${gutter}`}>
      <p className="mb-8 text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10 sm:py-16">
      <Example
        gutter="[--page-gutter:1.5rem] min-[1152px]:[--page-gutter:0px]"
        caption="Eight cards on native scroll snapping: the next one peeks, the counter says how many you have seen, and the arrows dim at the ends. Swipe, scroll, press the arrows, or focus the row and use the arrow keys"
      >
        <FeatureCarousel
          eyebrow="Product tour"
          title="Everything Halcyon does, one swipe at a time"
          description="Eight parts of the app that teams use every day. Nothing moves until you do."
          items={TOUR}
          bleed="var(--page-gutter)"
        />
      </Example>
      <div className="mx-auto mt-20 max-w-2xl border-t border-border pt-12 sm:mt-24">
        <Example gutter="[--page-gutter:1.5rem] min-[720px]:[--page-gutter:0px]" caption="In a narrow column, with icon tiles instead of pictures: the cards resize a little so the next one still peeks">
          <FeatureCarousel headingLevel={3} title="New this quarter" cardWidth={260} items={LATEST} bleed="var(--page-gutter)" />
        </Example>
      </div>
    </div>
  );
}
