import { IconAtSign, IconGlobe, IconRss } from "@rhs-ui/icons";
import { FooterMinimal } from "@rhs-ui/marketing/footer-minimal";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6">
      <FooterMinimal
        brand={<span className="text-base font-semibold tracking-tight">Northwind</span>}
        links={[
          { label: "Work", href: "#" },
          { label: "Studio", href: "#" },
          { label: "Journal", href: "#" },
          { label: "Contact", href: "#" },
          { label: "Privacy", href: "#" },
        ]}
        social={[
          { label: "Newsletter", href: "#", icon: <IconAtSign /> },
          { label: "RSS feed", href: "#", icon: <IconRss /> },
          { label: "Website", href: "#", icon: <IconGlobe /> },
        ]}
        legal="© 2026 Northwind Studio B.V. · KvK 12345678"
      />
    </div>
  );
}
