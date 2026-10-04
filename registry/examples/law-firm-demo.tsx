"use client";

import { LawFirm } from "@rhs-ui/templates/law-firm";

/** A pause that stands in for a network call in the demo. */
const settle = () => new Promise<void>((resolve) => setTimeout(resolve, 500));

export default function Demo(): React.JSX.Element {
  return <LawFirm onContact={settle} />;
}
