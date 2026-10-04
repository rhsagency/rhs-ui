import { IconHeadphones, IconMegaphone, IconMessage } from "@rhs-ui/icons";
import { ContactCards } from "@rhs-ui/marketing/contact-cards";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6">
      <ContactCards
        title="Talk to the right person."
        description="Three inboxes, each read by people who can actually help."
        routes={[
          { icon: <IconMessage />, title: "Sales", description: "Pricing for larger teams, security reviews and invoices instead of cards.", promise: "Reply within a working day", label: "Book a call", href: "#sales" },
          { icon: <IconHeadphones />, title: "Support", description: "Something not working, or not working the way you expected.", promise: "Mon to Fri, 8:00 to 20:00 CET", label: "support@example.com", href: "mailto:support@example.com" },
          { icon: <IconMegaphone />, title: "Press", description: "Interviews, logos and the numbers we can share.", promise: "Press kit available any time", label: "Open the press kit", href: "#press" },
        ]}
      />
    </div>
  );
}
