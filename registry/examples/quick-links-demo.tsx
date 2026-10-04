import { IconBook, IconCode, IconMessages, IconRocket } from "@rhs-ui/icons";
import { QuickLinks } from "@rhs-ui/primitives/quick-links";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-3xl p-8">
      <QuickLinks
        title="Get started"
        links={[
          { href: "#start", title: "Quick start", description: "Install and ship a first page in ten minutes.", icon: <IconRocket className="size-5" /> },
          { href: "#guides", title: "Guides", description: "Theming, dark mode and forms, step by step.", icon: <IconBook className="size-5" /> },
          { href: "#api", title: "API reference", description: "Every prop of every component.", icon: <IconCode className="size-5" /> },
          { href: "https://example.com", title: "Community", description: "Ask a question or show what you built.", icon: <IconMessages className="size-5" />, external: true },
        ]}
      />
    </div>
  );
}
