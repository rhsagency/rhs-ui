"use client";

import { AgencyServices } from "@rhs-ui/templates/agency-services";

/** A pause that stands in for a network call in the demo. */
const settle = () => new Promise<void>((resolve) => setTimeout(resolve, 500));

export default function Demo(): React.JSX.Element {
  return <AgencyServices onContact={settle} />;
}
