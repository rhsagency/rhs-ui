import { FamilySitesBar } from "@rhs-ui/marketing/family-sites-bar";
import { Navbar } from "@rhs-ui/marketing/navbar";
import { Button } from "@rhs-ui/primitives/button";

const SITES = [
  { label: "Northwind Bikes", href: "https://bikes.northwind.example" },
  { label: "Northwind Coffee", href: "https://coffee.northwind.example" },
  { label: "Northwind Studio", href: "https://studio.northwind.example" },
  { label: "Northwind Labs", href: "https://labs.northwind.example" },
];

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-6 py-6">
      <figure className="grid gap-3">
        <figcaption className="text-xs leading-relaxed text-muted-foreground">
          Above the header of one of four sites. The one you are on is heavier and underlined, and a screen reader hears &ldquo;Current site&rdquo; after it. Below 1024px the strip keeps to one line: the group and a button that opens the list.
        </figcaption>
        <div className="overflow-hidden rounded-xl border border-border bg-background">
          <FamilySitesBar
            group={{ label: "Part of Northwind", href: "https://northwind.example" }}
            sites={SITES}
            current="https://coffee.northwind.example"
            trailing={{ label: "All Northwind companies", href: "https://northwind.example/companies" }}
          />
          <Navbar
            sticky={false}
            brand={
              <a href="#top" className="rounded-sm text-base font-semibold tracking-tight outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40">
                Northwind Coffee
              </a>
            }
            items={[
              { label: "Beans", href: "#beans" },
              { label: "Subscriptions", href: "#subscriptions" },
              { label: "Cafés", href: "#cafes" },
              { label: "Journal", href: "#journal" },
            ]}
            currentHref="#beans"
            actions={<Button size="sm">Order beans</Button>}
          />
          <section className="mx-auto max-w-2xl px-6 py-14 text-center">
            <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">Roasted in Utrecht</p>
            <h2 className="mt-4 text-4xl leading-[1.05] font-medium tracking-[-0.045em] text-balance sm:text-5xl">Coffee that arrives the week it was roasted.</h2>
            <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-pretty text-muted-foreground">Four single-origin beans, a subscription you can pause from your phone, and a roaster who answers email.</p>
          </section>
        </div>
      </figure>

      <figure className="grid gap-3">
        <figcaption className="text-xs leading-relaxed text-muted-foreground">
          On the group&apos;s own home page no site is current, so none is marked. The link on the right leaves the family, so it opens in a new tab.
        </figcaption>
        <div className="overflow-hidden rounded-xl border border-border bg-background">
          <FamilySitesBar
            group={{ label: "Part of Halcyon", href: "https://halcyon.example" }}
            sites={[
              { label: "Primary school", href: "https://primary.halcyon.example" },
              { label: "Secondary school", href: "https://secondary.halcyon.example" },
              { label: "Sixth form", href: "https://sixth.halcyon.example" },
              { label: "Adult learning", href: "https://adults.halcyon.example" },
            ]}
            trailing={{ label: "Halcyon Education Trust", href: "https://trust.example", external: true }}
            labels={{ nav: "Schools in the trust", menu: "Our schools", current: "This school" }}
          />
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
            <span className="text-base font-semibold tracking-tight">Halcyon Education Trust</span>
            <span className="hidden text-sm text-muted-foreground sm:inline">Seven schools, one trust</span>
          </div>
          {/* A page under the header, so the list that opens below 1024px lies over a page and the frame never cuts it off. */}
          <section className="mx-auto max-w-6xl px-4 pt-6 pb-12 sm:px-6 sm:pt-10 sm:pb-16">
            <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">Admissions 2027</p>
            <h2 className="mt-4 max-w-xl text-3xl leading-[1.08] font-medium tracking-[-0.04em] text-balance sm:text-4xl">A school for every stage of learning.</h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-pretty text-muted-foreground">
              From a child&apos;s first day at the primary school to an evening course in adult learning, the trust keeps one admissions calendar. Open days start in October.
            </p>
          </section>
        </div>
      </figure>
    </div>
  );
}
