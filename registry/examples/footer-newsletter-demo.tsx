"use client";

import { IconLayers } from "@rhs-ui/icons";
import { FooterNewsletter } from "@rhs-ui/marketing/footer-newsletter";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6">
      <FooterNewsletter
        brand={<span className="inline-flex items-center gap-2"><IconLayers className="size-5" /> Ledger</span>}
        tagline="Calm project planning for teams that ship."
        onSubscribe={() => new Promise<void>((resolve) => setTimeout(resolve, 500))}
        columns={[
          { title: "Product", links: [{ label: "Features", href: "#features" }, { label: "Pricing", href: "#pricing" }, { label: "Changelog", href: "#changelog" }, { label: "Download", href: "#download" }] },
          { title: "Company", links: [{ label: "About", href: "#about" }, { label: "Careers", href: "#careers" }, { label: "Press", href: "#press" }] },
          { title: "Resources", links: [{ label: "Guides", href: "#guides" }, { label: "Templates", href: "#templates" }, { label: "Help centre", href: "#help" }] },
          { title: "Legal", links: [{ label: "Privacy", href: "#privacy" }, { label: "Terms", href: "#terms" }, { label: "Security", href: "#security" }] },
        ]}
        legal={<><span>© 2026 Ledger B.V., Utrecht</span><span className="flex gap-4"><a href="#status">Status</a><a href="#cookies">Cookie settings</a></span></>}
      />
    </div>
  );
}
