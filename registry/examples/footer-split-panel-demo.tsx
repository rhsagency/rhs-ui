import { IconArrowRight, IconCamera, IconGitBranch, IconRss, IconVideo } from "@rhs-ui/icons";
import { FooterSplitPanel } from "@rhs-ui/marketing/footer-split-panel";
import { Button } from "@rhs-ui/primitives/button";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto grid max-w-6xl gap-14 px-6 py-6">
      <figure className="grid gap-3">
        <figcaption className="text-xs leading-relaxed text-muted-foreground">
          The card is the primary pair turned round, with a hairline inside its edge. The Button is a plain one: inside the card the tokens swap, so it needs no class. On a phone the card comes first and the columns follow two across.
        </figcaption>
        <div className="overflow-hidden rounded-xl border border-border bg-background">
          <FooterSplitPanel
            brand={<span className="text-xl font-semibold tracking-tight">Halcyon</span>}
            statement="Plan the week once. Let Halcyon keep it true."
            action={
              <Button asChild size="lg">
                <a href="#trial">
                  Start your free trial
                  <IconArrowRight />
                </a>
              </Button>
            }
            social={[
              { label: "Halcyon on Instagram", href: "https://example.com/halcyon/instagram", icon: <IconCamera /> },
              { label: "Halcyon on YouTube", href: "https://example.com/halcyon/video", icon: <IconVideo /> },
              { label: "Halcyon on GitHub", href: "https://example.com/halcyon/code", icon: <IconGitBranch /> },
              { label: "Halcyon updates feed", href: "https://example.com/halcyon/feed", icon: <IconRss /> },
            ]}
            columns={[
              {
                title: "Product",
                links: [
                  { label: "Scheduling", href: "#scheduling" },
                  { label: "Reminders", href: "#reminders" },
                  { label: "Payments", href: "#payments" },
                  { label: "Reports", href: "#reports" },
                  { label: "Integrations", href: "#integrations" },
                ],
              },
              {
                title: "Company",
                links: [
                  { label: "About", href: "#about" },
                  { label: "Customers", href: "#customers" },
                  { label: "Careers", href: "#careers" },
                  { label: "Press", href: "#press" },
                ],
              },
              {
                title: "Resources",
                links: [
                  { label: "Guides", href: "#guides" },
                  { label: "Changelog", href: "#changelog" },
                  { label: "API reference", href: "#api" },
                  { label: "System status", href: "https://example.com/status", external: true },
                ],
              },
            ]}
            legal="© 2026 Halcyon Scheduling B.V."
            legalLinks={[
              { label: "Privacy", href: "#privacy" },
              { label: "Terms", href: "#terms" },
              { label: "Cookies", href: "#cookies" },
              { label: "Security", href: "#security" },
            ]}
          />
        </div>
      </figure>

      <figure className="grid gap-3">
        <figcaption className="text-xs leading-relaxed text-muted-foreground">With no action and no profiles the card keeps its shape and just says its sentence.</figcaption>
        <div className="overflow-hidden rounded-xl border border-border bg-background">
          <FooterSplitPanel
            navLabel="Footer, studio"
            brand={<span className="text-xl font-semibold tracking-tight">Kestrel Studio</span>}
            statement="Photography you can keep using, for as long as you need it."
            columns={[
              {
                title: "Studio",
                links: [
                  { label: "Library", href: "#library" },
                  { label: "Licences", href: "#licences" },
                  { label: "Retouching", href: "#retouching" },
                ],
              },
              {
                title: "Contact",
                links: [
                  { label: "Amsterdam", href: "#amsterdam" },
                  { label: "Ghent", href: "#ghent" },
                  { label: "Press enquiries", href: "#press" },
                ],
              },
            ]}
            legal="© 2026 Kestrel Studio"
            legalLinks={[{ label: "Privacy", href: "#privacy" }]}
          />
        </div>
      </figure>
    </div>
  );
}
