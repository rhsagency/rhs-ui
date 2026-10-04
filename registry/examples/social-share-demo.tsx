"use client";

import { SocialShare } from "@rhs-ui/primitives/social-share";

export default function Demo(): React.JSX.Element {
  return (
    <div className="relative flex min-h-40 items-center justify-center p-6">
      <SocialShare url="https://rhsui.com/blog/quiet-software" title="Why quiet software wins" />
    </div>
  );
}
