import { FooterInvertedContact } from "@rhs-ui/marketing/footer-inverted-contact";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-6 py-6">
      <figure className="grid gap-3">
        <figcaption className="text-xs leading-relaxed text-muted-foreground">
          The page ends on the inverted pair of the theme: one very large address with an arrow, three small columns beneath and the studio's local time, which is rewritten every minute and read out as a label, never announced as it ticks.
        </figcaption>
        <section aria-label="Atelier Nord, full footer" className="overflow-hidden rounded-xl border border-border bg-background">
          <FooterInvertedContact
            headline="Have a project in mind? Write to us, and we will answer within two working days."
            email="hello@ateliernord.example"
            address={["Atelier Nord", "Keizersgracht 412", "1016 GZ Amsterdam", "The Netherlands"]}
            social={[
              { label: "Instagram", href: "https://example.com/ateliernord/instagram" },
              { label: "Are.na", href: "https://example.com/ateliernord/arena" },
              { label: "Vimeo", href: "https://example.com/ateliernord/vimeo" },
            ]}
            links={[
              { label: "Work", href: "#work" },
              { label: "Studio", href: "#studio" },
              { label: "Journal", href: "#journal" },
              { label: "Careers", href: "#careers" },
            ]}
            city="Amsterdam"
            timeZone="Europe/Amsterdam"
            locale="en-GB"
            legal="© 2026 Atelier Nord. Chamber of Commerce 12345678."
          />
        </section>
      </figure>

      <figure className="grid gap-3">
        <figcaption className="text-xs leading-relaxed text-muted-foreground">A long address breaks after the @ instead of running off the screen, and with nothing else to show the footer is the address and the time.</figcaption>
        <section aria-label="Kestrel Studio, short footer" className="overflow-hidden rounded-xl border border-border bg-background">
          <FooterInvertedContact email="commissions@kestrelstudio-photography.example" city="Lisbon" timeZone="Europe/Lisbon" locale="en-GB" legal="© 2026 Kestrel Studio" />
        </section>
      </figure>
    </div>
  );
}
