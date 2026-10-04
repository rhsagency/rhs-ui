"use client";

import { OnlineCourse } from "@rhs-ui/templates/online-course";

/** A pause that stands in for a network call in the demo. */
const settle = () => new Promise<void>((resolve) => setTimeout(resolve, 500));

export default function Demo(): React.JSX.Element {
  return <OnlineCourse onEnrol={settle} />;
}
