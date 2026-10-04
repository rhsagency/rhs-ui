"use client";

import { Podcast } from "@rhs-ui/templates/podcast";

/** A pause that stands in for a network call in the demo. */
const settle = () => new Promise<void>((resolve) => setTimeout(resolve, 500));

export default function Demo(): React.JSX.Element {
  return <Podcast onSubscribe={settle} />;
}
