"use client";
import { CopyField } from "@rhs-ui/application/copy-field";
export default function Demo(): React.JSX.Element { return <div className="w-full max-w-xl p-6"><p className="mb-4 text-sm font-medium">Install a little motion.</p><CopyField value="npx shadcn@latest add https://rhsui.com/r/animated-price.json" label="Copy install command" /></div>; }
