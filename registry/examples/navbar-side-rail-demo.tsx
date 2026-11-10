"use client";

import { createContext, useContext, useEffect, useRef, useState, type ComponentProps, type CSSProperties, type ReactNode } from "react";

import { NavbarSideRail, type NavbarSideRailProps, type SideRailFooter } from "@rhs-ui/marketing/navbar-side-rail";

const BRAND = (
  <a href="#top" className="rounded-sm text-lg font-semibold tracking-[-0.03em] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40">
    Atelier Nord
  </a>
);

const FOOTER: SideRailFooter = {
  email: "hello@ateliernord.example",
  social: [
    { label: "Instagram", href: "https://example.com/ateliernord/instagram" },
    { label: "Are.na", href: "https://example.com/ateliernord/arena" },
    { label: "Vimeo", href: "https://example.com/ateliernord/vimeo" },
  ],
  note: "© 2026 Atelier Nord",
};

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-6 py-6">
      <figure className="grid gap-3">
        <figcaption className="text-xs leading-relaxed text-muted-foreground">
          From 1024px the rail is fixed to the left edge and the page sits beside it; the current page has a dot (click another page and it moves), and the number is a count. Below 1024px it becomes a top bar: narrow the window and press Menu, and the same pages open in a sheet. The page region is a div here (contentAs) because the preview page already has a main landmark; by default it is the main.
        </figcaption>
        <Page label="Page with the rail at the top">
          <DemoRail
            mainId="rail-main-top"
            contentAs="div"
            brand={BRAND}
            initial="#work"
            footer={FOOTER}
            links={[
              { label: "Work", href: "#work", count: 24 },
              { label: "Studio", href: "#studio" },
              { label: "Journal", href: "#journal", count: 12 },
              { label: "Contact", href: "#contact" },
            ]}
          />
        </Page>
      </figure>

      <figure className="grid gap-3">
        <figcaption className="text-xs leading-relaxed text-muted-foreground">
          The page scrolled: the rail stays put while the content passes beside it. This one is 13rem wide, has no foot and sits on another page; the width is also available as var(--rail-width).
        </figcaption>
        <Page label="Page scrolled down" scrolled={340}>
          <DemoRail
            mainId="rail-main-scrolled"
            contentAs="div"
            width="13rem"
            brand={BRAND}
            initial="#journal"
            labels={{ nav: "Main, scrolled" }}
            links={[
              { label: "Work", href: "#work" },
              { label: "Studio", href: "#studio" },
              { label: "Journal", href: "#journal" },
              { label: "Contact", href: "#contact" },
            ]}
          />
        </Page>
      </figure>
    </div>
  );
}

/** What a click on a page link tells the preview: which page is current now. Your site gets this from its router. */
const Choose = createContext<(href: string) => void>(() => {});

/**
 * The link the rail renders in place of your router's Link. A click makes its page the current one, so the dot, its transition and the
 * hover state can all be tried; the address is left alone because there is no real page behind it.
 */
function DemoLink({ href, onClick, ...props }: ComponentProps<"a">): React.JSX.Element {
  const choose = useContext(Choose);
  return (
    <a
      href={href}
      onClick={(event) => {
        // The phone menu closes itself in this handler, so it runs first.
        onClick?.(event);
        event.preventDefault();
        if (href) choose(href);
      }}
      {...props}
    />
  );
}

/** The rail with the current page held in state, starting at `initial`. */
function DemoRail({ initial, ...rail }: Omit<NavbarSideRailProps, "currentHref" | "linkAs" | "children"> & { initial: string }): React.JSX.Element {
  const [current, setCurrent] = useState(initial);
  return (
    <Choose.Provider value={setCurrent}>
      <NavbarSideRail {...rail} currentHref={current} linkAs={DemoLink}>
        <Work />
      </NavbarSideRail>
    </Choose.Provider>
  );
}

/**
 * A page in a frame that scrolls on its own, so the rail can be seen at rest and after a scroll in one preview. The frame has a transform,
 * which makes it the containing block of the fixed rail; in your page the window scrolls and the rail is fixed to it.
 */
function Page({ label, scrolled = 0, children }: { label: string; scrolled?: number; children: ReactNode }): React.JSX.Element {
  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scrolled) scroller.current?.scrollTo({ top: scrolled });
  }, [scrolled]);
  return (
    <section aria-label={label} className="relative h-[31rem] transform-gpu overflow-hidden rounded-xl border border-border bg-background">
      <div ref={scroller} className="relative h-full overflow-y-auto overscroll-contain">
        {children}
      </div>
    </section>
  );
}

/* Four projects drawn with shapes, so the page needs no pictures. In your site: your own photographs. */
const PROJECTS: readonly { name: string; place: string; shape: ReactNode }[] = [
  {
    name: "Fjord house",
    place: "Lofoten, 2025",
    shape: (
      <>
        <span className="absolute inset-x-0 bottom-0 h-[30%] bg-foreground/10" />
        <span className="absolute bottom-[30%] left-[16%] h-[34%] w-[42%] bg-foreground/80" />
        <span className="absolute bottom-[30%] left-[58%] h-[20%] w-[22%] bg-foreground/45" />
      </>
    ),
  },
  {
    name: "Library at Lillestrom",
    place: "Akershus, 2024",
    shape: (
      <>
        <span className="absolute inset-x-0 bottom-0 h-[22%] bg-foreground/10" />
        {[14, 28, 42, 56, 70].map((left, index) => (
          <span key={left} style={{ left: `${left}%`, height: `${34 + (index % 3) * 10}%` } as CSSProperties} className="absolute bottom-[22%] w-[8%] bg-foreground/75" />
        ))}
      </>
    ),
  },
  {
    name: "Sauna pavilion",
    place: "Nesodden, 2023",
    shape: (
      <>
        <span className="absolute inset-x-0 bottom-0 h-[26%] bg-foreground/10" />
        <span className="absolute bottom-[26%] left-[24%] h-[24%] w-[52%] bg-foreground/80" />
        <span className="absolute bottom-[50%] left-[24%] h-[22%] w-[52%] rounded-t-full bg-foreground/55" />
      </>
    ),
  },
  {
    name: "Harbour studio",
    place: "Tromso, 2022",
    shape: (
      <>
        <span className="absolute inset-x-0 bottom-0 h-[26%] bg-foreground/10" />
        <span style={{ clipPath: "polygon(0 100%, 100% 100%, 100% 0)" }} className="absolute bottom-[26%] left-[14%] h-[40%] w-[34%] bg-foreground/80" />
        <span style={{ clipPath: "polygon(0 0, 100% 100%, 0 100%)" }} className="absolute bottom-[26%] left-[48%] h-[28%] w-[28%] bg-foreground/50" />
      </>
    ),
  },
];

function Work(): React.JSX.Element {
  return (
    <div className="px-6 pt-10 pb-16 sm:px-10 lg:px-14 lg:pt-14">
      <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
        Architecture and interiors, Oslo
      </p>
      <h2 className="mt-5 max-w-3xl text-4xl leading-[1.04] font-medium tracking-[-0.045em] text-balance sm:text-5xl lg:text-[3.5rem]">Houses that sit quietly in their landscape.</h2>
      <ul className="mt-12 grid gap-x-6 gap-y-10 sm:grid-cols-2">
        {PROJECTS.map((project) => (
          <li key={project.name} className="grid gap-3">
            <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted">{project.shape}</div>
            <div className="flex items-baseline justify-between gap-4 text-sm">
              <p className="font-medium">{project.name}</p>
              <p className="text-muted-foreground tabular-nums">{project.place}</p>
            </div>
          </li>
        ))}
      </ul>
      <h2 className="mt-16 text-2xl font-medium tracking-[-0.035em]">
        The studio
      </h2>
      <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">Eleven people, one long table and a workshop where every model is built by hand before a drawing is final. We take few commissions a year and see each one through its first winter.</p>
      <h2 className="mt-12 text-2xl font-medium tracking-[-0.035em]">
        Journal
      </h2>
      <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">Notes from site visits, material tests and the occasional failure, written the week it happened.</p>
    </div>
  );
}
