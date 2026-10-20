import { SitemapPage } from "@rhs-ui/marketing/sitemap-page";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <SitemapPage
        sections={[
          {
            label: "Product",
            href: "#product",
            description: "What Northwind does and what it costs.",
            pages: [
              { label: "Overview", href: "#overview" },
              { label: "Features", href: "#features" },
              { label: "Pricing", href: "#pricing" },
              { label: "Integrations", href: "#integrations" },
              { label: "Changelog", href: "#changelog" },
              { label: "Security", href: "#security" },
            ],
          },
          {
            label: "Solutions",
            href: "#solutions",
            description: "How teams use it from the first shipment to the last invoice.",
            pages: [
              {
                label: "By team",
                open: true,
                pages: [
                  { label: "Operations", href: "#operations" },
                  { label: "Finance", href: "#finance" },
                  { label: "Customer support", href: "#customer-support" },
                ],
              },
              {
                label: "By industry",
                pages: [
                  { label: "Retail", href: "#retail" },
                  { label: "Wholesale", href: "#wholesale" },
                  { label: "Third-party logistics", href: "#3pl" },
                ],
              },
              { label: "Customer stories", href: "#stories" },
            ],
          },
          {
            label: "Resources",
            href: "#resources",
            description: "Guides, documentation and answers when you need them.",
            pages: [
              { label: "Blog", href: "#blog" },
              {
                label: "Guides",
                href: "#guides",
                pages: [
                  { label: "Getting started in a day", href: "#getting-started" },
                  { label: "Moving from spreadsheets", href: "#spreadsheets" },
                  { label: "The admin handbook", href: "#admin-handbook" },
                ],
              },
              { label: "Documentation", href: "#docs" },
              { label: "Webinars", href: "#webinars" },
              { label: "Help centre", href: "#help" },
            ],
          },
          {
            label: "Developers",
            href: "#developers",
            description: "Build on the Northwind API.",
            pages: [
              { label: "API reference", href: "#api" },
              { label: "SDKs", href: "#sdks" },
              { label: "Webhooks", href: "#webhooks" },
              { label: "System status", href: "#status" },
            ],
          },
          {
            label: "Company",
            href: "#company",
            description: "Who we are and how to reach us.",
            pages: [
              { label: "About", href: "#about" },
              { label: "Leadership", href: "#leadership" },
              { label: "Careers", href: "#careers" },
              { label: "Press", href: "#press" },
              { label: "Contact", href: "#contact" },
            ],
          },
          {
            label: "Legal",
            description: "The small print, in plain language.",
            pages: [
              { label: "Terms of service", href: "#terms" },
              { label: "Privacy policy", href: "#privacy" },
              { label: "Cookie declaration", href: "#cookies" },
              { label: "Imprint", href: "#imprint" },
              { label: "Code of conduct", href: "#conduct" },
            ],
          },
        ]}
      />

      <p className="mt-16 mb-8 border-t border-border pt-8 text-xs text-muted-foreground">A small studio: two columns, no descriptions, and its own name for the landmark</p>
      <SitemapPage
        columns={2}
        showDescriptions={false}
        label="Studio sitemap"
        sections={[
          {
            label: "Work",
            href: "#work",
            pages: [
              { label: "Selected projects", href: "#projects" },
              { label: "Services", href: "#services" },
              { label: "How we work", href: "#process" },
            ],
          },
          {
            label: "Studio",
            href: "#studio",
            pages: [
              { label: "About", href: "#about-studio" },
              { label: "Team", href: "#team" },
              { label: "Journal", href: "#journal" },
              { label: "Say hello", href: "#hello" },
            ],
          },
        ]}
      />
    </div>
  );
}
