import { IconGlobe, IconHelp, IconUser } from "@rhs-ui/icons";
import { Navbar } from "@rhs-ui/marketing/navbar";
import { UtilityBar, type UtilityBarLink } from "@rhs-ui/marketing/utility-bar";
import { Button } from "@rhs-ui/primitives/button";

const LINKS: readonly UtilityBarLink[] = [
  { label: "Customer portal", href: "#portal", icon: <IconUser /> },
  { label: "Help", href: "#help", icon: <IconHelp /> },
  { label: "Nederlands", href: "#nl", icon: <IconGlobe />, lang: "nl" },
];

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-6 py-6">
      <figure className="grid gap-3">
        <figcaption className="text-xs leading-relaxed text-muted-foreground">
          Open: a filled dot and the closing time in words. The utility links sit on the right from 768px and the email joins them from 1024px; on a phone only the phone link and the status stay.
        </figcaption>
        <div className="overflow-hidden rounded-xl border border-border bg-background">
          <UtilityBar phone="030 555 0142" email="hello@kestrelcycles.example" status={{ open: true, text: "Open until 17:30" }} links={LINKS} />
          <Navbar
            sticky={false}
            brand={
              <a href="#top" className="rounded-sm text-base font-semibold tracking-tight outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40">
                Kestrel Cycles
              </a>
            }
            items={[
              { label: "Repairs", href: "#repairs" },
              { label: "Used bikes", href: "#used" },
              { label: "Workshop", href: "#workshop" },
              { label: "About us", href: "#about" },
            ]}
            currentHref="#repairs"
            actions={<Button size="sm">Book a repair</Button>}
          />
          <section className="mx-auto max-w-2xl px-6 py-14 text-center">
            <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">Utrecht, since 1987</p>
            <h2 className="mt-4 text-4xl leading-[1.05] font-medium tracking-[-0.045em] text-balance sm:text-5xl">Repairs done while you wait, or by tomorrow.</h2>
            <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-pretty text-muted-foreground">Walk in with a flat tyre or book a full service. Everything is priced before we pick up a spanner.</p>
          </section>
        </div>
      </figure>

      <figure className="grid gap-3">
        <figcaption className="text-xs leading-relaxed text-muted-foreground">Closed: a hollow dot and when the shop opens next. The dot only repeats what the words already say.</figcaption>
        <div className="overflow-hidden rounded-xl border border-border bg-background">
          <UtilityBar
            phone="030 555 0142"
            email="hello@kestrelcycles.example"
            status={{ open: false, text: "Closed, opens Monday 08:00" }}
            links={LINKS}
            labels={{ contact: "Contact, shop closed", links: "Utility, shop closed" }}
          />
        </div>
      </figure>
    </div>
  );
}
