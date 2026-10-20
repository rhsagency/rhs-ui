import { FaqSidebarCategories } from "@rhs-ui/marketing/faq-sidebar-categories";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6">
      <FaqSidebarCategories
        eyebrow="Help centre"
        title="Everything people ask before they switch"
        description="Plain answers to the questions we hear most, kept on one page so you can search it, share it and come back to it."
        contact={{
          title: "Still have a question?",
          description: "A person answers within two hours on weekdays, in English or Dutch.",
          label: "Talk to support",
          href: "#support",
        }}
        categories={[
          {
            id: "getting-started",
            title: "Getting started",
            questions: [
              {
                id: "how-long-does-setup-take",
                question: "How long does setup take?",
                answer: "Most teams are live in an afternoon. You import your drivers from a spreadsheet, draw your depots on a map and run a first route before the end of the day. If you use another dispatch tool today, we help you move over for free.",
              },
              {
                id: "do-drivers-need-special-hardware",
                question: "Do my drivers need special hardware?",
                answer: "No. The driver app runs on any Android phone from 2019 and on an iPhone 8 or newer. A scanner is optional, and the one we sell clips onto the phone.",
              },
              {
                id: "is-there-a-free-trial",
                question: "Is there a free trial?",
                answer: "Yes: 30 days with every feature and up to 10 drivers, and no card needed. If you do not continue, we delete your data after 60 days.",
              },
              {
                id: "can-i-import-my-customers",
                question: "Can I import my customers and addresses?",
                answer: "From CSV or Excel. We check and correct every address on import and show you the ones we could not match, so you can fix them in one pass.",
              },
            ],
          },
          {
            id: "plans-and-billing",
            title: "Plans and billing",
            questions: [
              {
                id: "can-i-change-plan-any-time",
                question: "Can I change plan whenever I like?",
                answer: "At any time. Upgrades apply immediately and are charged pro rata. Downgrades start at the next billing date, so you keep what you paid for.",
              },
              {
                id: "how-are-drivers-counted",
                question: "How are drivers counted?",
                answer: "A driver counts for a month when they complete at least one route in it. People who only have an account, such as dispatchers and managers, are free.",
              },
              {
                id: "is-there-an-annual-discount",
                question: "Do you offer an annual discount?",
                answer: "Two months free when you pay for the year up front. The discount is applied at checkout, and you can switch back to monthly at renewal.",
              },
              {
                id: "invoices-with-our-vat-number",
                question: "Can I get invoices with our VAT number?",
                answer: "Add it under Settings, Billing. It appears on every invoice from then on, and we can reissue past ones if you need them.",
              },
            ],
          },
          {
            id: "security-and-privacy",
            title: "Security and privacy",
            questions: [
              {
                id: "where-is-our-data-stored",
                question: "Where is our data stored?",
                answer: "In Frankfurt and Amsterdam, on infrastructure that never leaves the EU. Backups are encrypted and kept for 35 days.",
              },
              {
                id: "when-do-you-track-a-driver",
                question: "When do you track a driver's location?",
                answer: "Only while a route is active, and only from the driver's own phone. A banner shows when tracking is on, and it switches off the moment the route ends.",
              },
              {
                id: "do-you-support-single-sign-on",
                question: "Do you support single sign-on?",
                answer: "SAML and OpenID Connect, on the Scale and Enterprise plans. Setup takes about ten minutes with your identity provider's metadata.",
              },
              {
                id: "how-do-i-delete-everything",
                question: "How do I delete everything?",
                answer: "Owners can delete the workspace under Settings, General. It is queued for seven days in case of a mistake, then removed for good, backups included.",
              },
            ],
          },
        ]}
      />
    </div>
  );
}
