"use client";

import { useState } from "react";

import { AiRewriteMenu } from "@rhs-ui/application/ai-rewrite-menu";
import { Textarea } from "@rhs-ui/primitives/textarea";

const REWRITES: Record<string, string> = {
  shorter: "Thanks for waiting. Your refund is on its way and should land within five working days.",
  formal: "Thank you for your patience. We have processed your refund, which you can expect within five working days.",
  friendly: "Thanks so much for hanging in there! Good news: your refund is on its way and should be with you in about five working days.",
};

export default function Demo(): React.JSX.Element {
  const [text, setText] = useState("hi, sorry it took so long, we did the refund now and it will be in your account in like 5 working days probably");
  return (
    <div className="mx-auto grid max-w-xl gap-3 p-8">
      <label htmlFor="ai-rewrite-reply" className="text-sm font-medium">Reply to customer</label>
      <Textarea id="ai-rewrite-reply" value={text} onChange={(event) => setText(event.target.value)} rows={4} />
      <AiRewriteMenu
        text={text}
        actions={[{ id: "shorter", label: "Shorter" }, { id: "formal", label: "More formal" }, { id: "friendly", label: "Friendlier" }]}
        onRewrite={(id) => new Promise<string>((resolve) => setTimeout(() => resolve(REWRITES[id] ?? text), 900))}
        onAccept={setText}
      />
    </div>
  );
}
