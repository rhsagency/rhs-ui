"use client";

import { CopyCommand } from "@rhs-ui/primitives/copy-command";

export default function Demo(): React.JSX.Element {
  return (
    <div className="relative flex min-h-40 items-center justify-center p-6">
      <CopyCommand
        commands={{
          pnpm: "pnpm dlx shadcn@latest add https://rhsui.com/r/button.json",
          npm: "npx shadcn@latest add https://rhsui.com/r/button.json",
          yarn: "yarn dlx shadcn@latest add https://rhsui.com/r/button.json",
          bun: "bunx shadcn@latest add https://rhsui.com/r/button.json",
        }}
      />
    </div>
  );
}
