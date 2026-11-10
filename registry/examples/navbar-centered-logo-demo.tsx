import type { NavbarEntry } from "@rhs-ui/marketing/navbar";
import { NavbarCenteredLogo } from "@rhs-ui/marketing/navbar-centered-logo";
import { Button } from "@rhs-ui/primitives/button";

const MARK = (
  <a href="#top" className="inline-block rounded-sm pl-[0.34em] text-lg font-medium tracking-[0.34em] uppercase outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40">
    Aurel
  </a>
);

const ITEMS: readonly NavbarEntry[] = [
  {
    label: "Collections",
    links: [
      { label: "Autumn 2026", href: "#autumn", description: "Wool, linen and the first cold mornings." },
      { label: "Atelier line", href: "#atelier-line", description: "Made to order in our Lisbon studio." },
      { label: "Archive", href: "#archive", description: "Pieces from the past ten seasons." },
      { label: "Gift cards", href: "#gift", description: "By email, or in a linen envelope." },
    ],
  },
  { label: "Atelier", href: "#atelier" },
  { label: "Journal", href: "#journal" },
];

const SHOP: readonly NavbarEntry[] = [
  { label: "Women", href: "#women" },
  { label: "Men", href: "#men" },
  { label: "Outerwear", href: "#outerwear" },
  { label: "Stores", href: "#stores" },
];

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-6 py-6">
      <figure className="grid gap-3">
        <figcaption className="text-xs text-muted-foreground">Links and a panel on the left, actions on the right, and the mark on the middle. Hover Collections, or tab to it and press Enter. Below 768px the links go into a sheet on the left and the actions into one button.</figcaption>
        <section aria-label="Bar with panel and actions" className="overflow-hidden rounded-xl border border-border bg-background">
          <NavbarCenteredLogo
            sticky={false}
            brand={MARK}
            items={ITEMS}
            currentHref="#atelier"
            actions={
              <>
                <Button variant="ghost" size="sm">
                  Sign in
                </Button>
                <Button size="sm">Book a fitting</Button>
              </>
            }
          />
          <div id="top" className="mx-auto max-w-2xl px-6 py-24 text-center">
            <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">Autumn 2026</p>
            <h2 className="mt-5 text-4xl leading-[1.05] font-medium tracking-[-0.045em] text-balance sm:text-5xl">Coats cut for the first cold morning.</h2>
            <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-pretty text-muted-foreground">Eleven pieces in undyed wool, made in small runs by the same four people who draw them.</p>
          </div>
        </section>
      </figure>

      <figure className="grid gap-3">
        <figcaption className="text-xs text-muted-foreground">Four links and nothing on the right: the mark stays on the middle. Three links fit beside it at 768px and five at 1024px, so these four sit in the sheet until 1024px. foldBelow moves that.</figcaption>
        <section aria-label="Bar with four links" className="overflow-hidden rounded-xl border border-border bg-background">
          <NavbarCenteredLogo sticky={false} brand={MARK} items={SHOP} currentHref="#men" navLabel="Shop" />
          <div className="mx-auto max-w-2xl px-6 py-16 text-center">
            <h2 className="text-2xl font-medium tracking-[-0.035em] text-balance sm:text-3xl">A quiet bar for a loud name.</h2>
          </div>
        </section>
      </figure>
    </div>
  );
}
