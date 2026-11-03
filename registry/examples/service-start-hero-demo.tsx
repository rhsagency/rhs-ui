import { ServiceStartHero } from "@rhs-ui/marketing/service-start-hero";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6">
      <p className="pt-6 text-xs text-muted-foreground">With a hint on every item, other ways to apply and the date the page was checked.</p>
      <ServiceStartHero
        titleAs="h2"
        className="py-8 sm:py-10 lg:py-12"
        title="Apply for housing allowance"
        lead="Use this service if you rent your home and your income is low. You will hear within eight weeks whether you get an allowance and how much."
        start={{ label: "Start now", href: "#start" }}
        duration="Takes about 10 minutes"
        requirements={[
          { label: "Your ID", hint: "A passport, ID card or driving licence that is still valid today." },
          { label: "Last year's income statement", hint: "The yearly statement from your employer or the tax office, for everyone who lives with you." },
          { label: "Your account number", hint: "The IBAN of the account the allowance should be paid into." },
        ]}
        alternatives={[
          { label: "By post", href: "#post" },
          { label: "At a service desk", href: "#desk" },
        ]}
        updatedAt="2026-10-21"
      />

      <p className="border-t border-border pt-6 text-xs text-muted-foreground">The shortest form: a title, a lead, the button and a list. No hints, no other ways, no date.</p>
      <ServiceStartHero
        titleAs="h2"
        className="py-8 sm:py-10 lg:py-12"
        title="Renew your driving licence"
        lead="You can renew up to four months before it runs out. Your new licence arrives by post within a week."
        start={{ label: "Start now", href: "#start" }}
        duration="Takes about 5 minutes"
        requirements={[{ label: "Your current licence" }, { label: "A passport photo, as a file" }, { label: "Your digital ID, or a code from the post office" }]}
      />
    </div>
  );
}
