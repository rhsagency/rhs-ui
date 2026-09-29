"use client";

import { useId, useState } from "react";

import { FooterSection } from "@rhs-ui/marketing/footer-section";
import { Button } from "@rhs-ui/primitives/button";
import { Input } from "@rhs-ui/primitives/input";

function Newsletter() {
  const id = useId();
  const [sent, setSent] = useState(false);
  return (
    <form
      className="grid max-w-xs gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        setSent(true);
      }}
    >
      <label htmlFor={id} className="text-sm font-medium">
        One email a month
      </label>
      <div className="flex gap-2">
        <Input id={id} type="email" autoComplete="email" required placeholder="you@studio.com" />
        <Button type="submit" variant="outline">
          Join
        </Button>
      </div>
      <p className="text-xs text-muted-foreground" role="status">
        {sent ? "Thanks. The next one lands on the first." : "New work and notes, nothing else."}
      </p>
    </form>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="-m-6 flex min-h-[40rem] flex-col justify-end">
      <FooterSection
        brand={<span className="text-base font-semibold tracking-tight">Fieldwork</span>}
        tagline="Planning for studios that would rather be making things."
        aside={<Newsletter />}
        columns={[
          { title: "Product", links: [{ label: "Planning", href: "#planning" }, { label: "Reviews", href: "#reviews" }, { label: "Reports", href: "#reports" }, { label: "Pricing", href: "#pricing" }] },
          { title: "Company", links: [{ label: "About", href: "#about" }, { label: "Careers", href: "#careers" }, { label: "Contact", href: "#contact" }] },
          { title: "Resources", links: [{ label: "Guides", href: "#guides" }, { label: "Changelog", href: "#changelog" }, { label: "Status", href: "https://example.com", external: true }] },
        ]}
        legal={<span>© 2026 Fieldwork. Made in Utrecht.</span>}
        legalLinks={[
          { label: "Privacy", href: "#privacy" },
          { label: "Terms", href: "#terms" },
          { label: "Cookies", href: "#cookies" },
        ]}
      />
    </div>
  );
}
