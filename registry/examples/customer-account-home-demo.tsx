import { IconCreditCard, IconHelp, IconMail, IconPackage, IconPin, IconReturn } from "@rhs-ui/icons";
import { CustomerAccountHome } from "@rhs-ui/commerce/customer-account-home";
import { Button } from "@rhs-ui/primitives/button";

const art = (fill: string, shape: string) => "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'><rect width='120' height='120' fill='${fill}'/>${shape}</svg>`);

const ITEMS = [
  { id: "shirt", name: "Linen shirt, stone", image: art("#e4e1da", "<path d='M36 34l24-10 24 10 14 18-14 8-6-8v46H42V52l-6 8-14-8z' fill='#a8a296'/>") },
  { id: "mug", name: "Stoneware mug", image: art("#d9dde0", "<rect x='34' y='40' width='44' height='46' rx='8' fill='#8c969c'/><path d='M78 52h10a9 9 0 010 18H78' fill='none' stroke='#8c969c' stroke-width='7'/>") },
  { id: "tote", name: "Waxed canvas tote", image: art("#2f3236", "<path d='M34 48h52l4 44H30z' fill='#6b7078'/><path d='M46 48a14 14 0 0128 0' fill='none' stroke='#9aa0a8' stroke-width='5'/>") },
] as const;

const LINKS = [
  { label: "Orders", href: "#orders", count: 12, hint: "Track, return or reorder", icon: <IconPackage /> },
  { label: "Addresses", href: "#addresses", count: 2, hint: "Home and office", icon: <IconPin /> },
  { label: "Returns", href: "#returns", count: 0, hint: "Nothing to send back", icon: <IconReturn /> },
  { label: "Payment methods", href: "#payment", hint: "Card ending 4242", icon: <IconCreditCard /> },
  { label: "Help", href: "#help", hint: "Chat, email or call", icon: <IconHelp /> },
];

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto w-full max-w-5xl min-w-0 px-6">
      <CustomerAccountHome
        headingAs="h2"
        name="Mira"
        memberSince="2024-03-14"
        locale="en-GB"
        timeZone="Europe/Amsterdam"
        latestOrder={{ number: "NW-20418", status: "shipped", placedAt: "2026-10-12T09:41:00Z", items: ITEMS, itemCount: 5, total: 18450, deliveryDate: "2026-10-29", href: "#order", trackHref: "#track" }}
        links={LINKS}
        nudge={
          <>
            <span className="inline-flex items-center gap-3">
              <IconMail aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
              Verify your email to get order updates.
            </span>
            <Button size="sm" variant="outline" className="ml-auto">
              Send the link
            </Button>
          </>
        }
      />

      <div className="border-t border-border">
        <p className="pt-8 text-xs text-muted-foreground">A brand-new account: no hole where the latest order would be</p>
        <CustomerAccountHome
          headingAs="h2"
          name="Joost"
          labels={{ account: "Your new account" }}
          memberSince="2026-10-24"
          locale="en-GB"
          shopHref="#shop"
          links={[
            { label: "Orders", href: "#orders", count: 0, hint: "Your orders will be here", icon: <IconPackage /> },
            { label: "Addresses", href: "#addresses", count: 0, hint: "Add one to check out faster", icon: <IconPin /> },
            { label: "Returns", href: "#returns", count: 0, icon: <IconReturn /> },
            { label: "Payment methods", href: "#payment", hint: "No cards saved", icon: <IconCreditCard /> },
            { label: "Help", href: "#help", hint: "Chat, email or call", icon: <IconHelp /> },
          ]}
        />
      </div>
    </div>
  );
}
