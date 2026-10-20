import { IconActivity, IconBan, IconCreditCard, IconDownload, IconEdit, IconEye, IconHeadphones, IconTrash, IconUser } from "@rhs-ui/icons";
import { PrivacyAtAGlance } from "@rhs-ui/marketing/privacy-at-a-glance";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <PrivacyAtAGlance
        title="Privacy at a glance"
        description="What we collect, why we collect it, how long we keep it and who receives it, in plain words. The full policy has the legal detail."
        policyHref="#policy"
        updated="2026-09-03"
        locale="en-GB"
        categories={[
          {
            title: "Account",
            icon: <IconUser />,
            what: "Your name, email address and a hash of your password. Never the password itself.",
            why: "To sign you in, keep your account safe and send you receipts.",
            retention: "While your account is open, and for 30 days after you close it.",
            sharedWith: "Nobody outside Northwind.",
          },
          {
            title: "Payments",
            icon: <IconCreditCard />,
            what: "The last four digits of your card, your billing address and your VAT number.",
            why: "To charge you, issue invoices and meet tax law.",
            retention: "Seven years, because Dutch tax law requires it.",
            sharedWith: "Polder Pay, our payment provider, and our accountants.",
          },
          {
            title: "Usage",
            icon: <IconActivity />,
            what: "Which features you use and how often, from your browser. Never the content of your work.",
            why: "To fix bugs and to decide what to build next.",
            retention: "14 months, then only totals remain and the detail is deleted.",
            sharedWith: "Halcyon Analytics, under a data processing agreement.",
          },
          {
            title: "Support",
            icon: <IconHeadphones />,
            what: "Your messages to us, and the account details you choose to include.",
            why: "To answer you, and to help our team learn from real questions.",
            retention: "Two years after your last message.",
            sharedWith: "Kestrel Desk, the tool our support team works in.",
          },
        ]}
        rights={[
          { label: "See your data", href: "#see", icon: <IconEye />, description: "Download a copy of everything we hold about you, in minutes." },
          { label: "Correct it", href: "#correct", icon: <IconEdit />, description: "Fix a name, address or setting yourself, or ask us to." },
          { label: "Delete it", href: "#delete", icon: <IconTrash />, description: "Close your account and we erase your data within 30 days." },
          { label: "Export it", href: "#export", icon: <IconDownload />, description: "Take your data to another service, in a standard format." },
          { label: "Object", href: "#object", icon: <IconBan />, description: "Tell us to stop using your data for a purpose you did not choose." },
        ]}
      />
    </div>
  );
}
