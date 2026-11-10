import { IconAtSign, IconGitBranch, IconRss } from "@rhs-ui/icons";
import { FooterLinkRows } from "@rhs-ui/marketing/footer-link-rows";

const MARK = <span className="text-base font-semibold tracking-tight">Halcyon</span>;

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-6 py-6">
      <figure className="grid gap-3">
        <figcaption className="text-xs text-muted-foreground">Three short groups, each one a row: the label on the left, the links inline beside it, and round icon links for the profiles. On a phone the label sits above its links.</figcaption>
        <section aria-label="Footer with three groups" className="overflow-hidden rounded-xl border border-border bg-background">
          <FooterLinkRows
            brand={MARK}
            tagline="Support software for teams who would rather answer than automate."
            social={[
              { label: "GitHub", href: "https://example.com/github", icon: <IconGitBranch /> },
              { label: "Newsletter", href: "https://example.com/newsletter", icon: <IconAtSign /> },
              { label: "RSS feed", href: "https://example.com/rss", icon: <IconRss /> },
            ]}
            groups={[
              {
                label: "Product",
                links: [
                  { label: "Features", href: "#features" },
                  { label: "Pricing", href: "#pricing" },
                  { label: "Changelog", href: "#changelog" },
                  { label: "Integrations", href: "#integrations" },
                  { label: "Roadmap", href: "#roadmap" },
                  { label: "System status", href: "https://example.com/status", external: true },
                ],
              },
              {
                label: "Company",
                links: [
                  { label: "About", href: "#about" },
                  { label: "Careers", href: "#careers" },
                  { label: "Press kit", href: "#press" },
                  { label: "Contact", href: "#contact" },
                ],
              },
              {
                label: "Legal",
                links: [
                  { label: "Privacy", href: "#privacy" },
                  { label: "Terms", href: "#terms" },
                  { label: "Cookies", href: "#cookies" },
                  { label: "Security", href: "#security" },
                  { label: "Subprocessors", href: "#subprocessors" },
                ],
              },
            ]}
            legal="© 2026 Halcyon Labs B.V. · KvK 87654321 · Made in Utrecht"
          />
        </section>
      </figure>

      <figure className="grid gap-3">
        <figcaption className="text-xs text-muted-foreground">Two groups, no tagline and profiles named in text: the footer shrinks to what it was given.</figcaption>
        <section aria-label="Footer with two groups" className="overflow-hidden rounded-xl border border-border bg-background">
          <FooterLinkRows
            navLabel="Studio footer"
            brand={<span className="text-base font-semibold tracking-tight">Northwind Studio</span>}
            social={[
              { label: "Instagram", href: "https://example.com/instagram" },
              { label: "Are.na", href: "https://example.com/arena" },
            ]}
            groups={[
              {
                label: "Studio",
                links: [
                  { label: "Work", href: "#work" },
                  { label: "Journal", href: "#journal" },
                  { label: "Contact", href: "#contact" },
                ],
              },
              { label: "Legal", links: [{ label: "Privacy", href: "#privacy" }, { label: "Terms", href: "#terms" }] },
            ]}
            legal="© 2026 Northwind Studio"
          />
        </section>
      </figure>
    </div>
  );
}
