"use client";

import { StudioPortfolio } from "@rhs-ui/templates/studio-portfolio";

export default function Demo(): React.JSX.Element {
  return (
    <StudioPortfolio
      name="Aperture"
      contactHref="mailto:hello@example.com"
      projects={[
        { id: "forma", title: "Forma", category: "Identity", description: "A quieter identity for everyday objects.", mark: "f.", href: "#studio-about" },
        { id: "index", title: "Index", category: "Digital", description: "A clear digital home for good ideas.", mark: "[i]", href: "#studio-about" },
        { id: "field", title: "Field Notes", category: "Identity", description: "An independent perspective, in print.", mark: "fn", href: "#studio-about" },
        { id: "arc", title: "Arc Studio", category: "Digital", description: "A considered portfolio for a growing practice.", mark: "a/r", href: "#studio-about" },
      ]}
    />
  );
}
