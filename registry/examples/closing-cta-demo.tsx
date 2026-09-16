"use client";
import { ClosingCta } from "@rhs-ui/marketing/closing-cta";
export default function Demo(): React.JSX.Element { return <div className="mx-auto w-full max-w-6xl p-6"><ClosingCta eyebrow="Your next chapter" title="Make something worth spending time with." description="A considered starting point for the conversation, project or idea that comes next." action={<a className="rounded-full bg-foreground px-6 py-3 text-sm text-background" href="mailto:hello@example.com">Start a conversation</a>} note="Replace the contact address with your own." /></div>; }
