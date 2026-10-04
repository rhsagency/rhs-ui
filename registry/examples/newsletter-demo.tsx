"use client";

import { Newsletter } from "@rhs-ui/templates/newsletter";

/** A pause that stands in for a network call in the demo. */
const settle = () => new Promise<void>((resolve) => setTimeout(resolve, 500));

export default function Demo(): React.JSX.Element {
  return <Newsletter onSubscribe={settle} />;
}
