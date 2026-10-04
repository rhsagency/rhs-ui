"use client";

import { IconMail, IconPhone, IconPin } from "@rhs-ui/icons";
import { ContactSection } from "@rhs-ui/marketing/contact-section";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6">
      <ContactSection
        title="Talk to a person, not a queue."
        description="Questions about a project, a quote or a running order. We answer within one working day."
        channels={[
          { icon: <IconMail />, label: "Email", value: "hello@northwind.studio", href: "mailto:hello@northwind.studio" },
          { icon: <IconPhone />, label: "Phone, weekdays 9 to 5", value: "+31 20 123 4567", href: "tel:+31201234567" },
          { icon: <IconPin />, label: "Studio", value: "Keizersgracht 12, Amsterdam" },
        ]}
        note="We only use your details to answer this message."
        onSubmit={() => new Promise((resolve) => setTimeout(resolve, 700))}
      />
    </div>
  );
}
