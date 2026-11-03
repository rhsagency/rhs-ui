import { LocaleDemo } from "@rhs-ui/marketing/locale-demo";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-4xl px-6 py-10 sm:py-16">
      <p className="mb-8 text-xs text-muted-foreground">Five markets, starting in German: the same amount, moment and count in every shape</p>
      <LocaleDemo
        eyebrow="Localisation"
        title="Your product, in every market"
        description="One price, one date and one number. Pick a language and each takes the shape that market expects, live."
        defaultLocale="de-DE"
        timeZone="Europe/Amsterdam"
        sample={{ amount: 1299.5, currency: "EUR", date: "2026-11-02T14:30:00Z", count: 3, number: 1284300.75, days: -3 }}
      />
      <div className="mt-20 border-t border-border pt-12 sm:mt-24">
        <p className="mb-8 text-xs text-muted-foreground">Starting in Arabic: the card turns around, the digits change and 11 takes its own plural form</p>
        <LocaleDemo
          headingLevel={3}
          title="Right to left, too"
          description="Direction, digits and plural forms follow the language, not just the words."
          defaultLocale="ar-EG"
          timeZone="Africa/Cairo"
          sample={{ amount: 2499.9, currency: "EGP", date: "2026-11-14T07:05:00Z", count: 11, number: 48210.5, days: 5 }}
        />
      </div>
    </div>
  );
}
