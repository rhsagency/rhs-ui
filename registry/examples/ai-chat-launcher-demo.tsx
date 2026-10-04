"use client";

import { useState } from "react";

import { AiChatLauncher } from "@rhs-ui/application/ai-chat-launcher";
import { ChatThread, type ChatMessage } from "@rhs-ui/application/chat-thread";
import { PromptInput } from "@rhs-ui/application/prompt-input";

export default function Demo(): React.JSX.Element {
  const [messages, setMessages] = useState<ChatMessage[]>([{ id: "1", author: "ai", name: "Ask Ledger", body: "Hi! Ask me anything about plans, billing or getting started." }]);
  const [typing, setTyping] = useState(false);
  function send(text: string) {
    setMessages((list) => [...list, { id: String(list.length + 1), author: "me", name: "You", body: text, state: "sent" }]);
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMessages((list) => [...list, { id: String(list.length + 1), author: "ai", name: "Ask Ledger", body: "Annual plans can be paid by invoice with a 30-day term. Want me to set that up?" }]);
    }, 900);
  }
  return (
    <div className="relative mx-auto h-[38rem] max-w-3xl overflow-clip rounded-2xl border border-border bg-muted/30">
      <p className="p-6 text-sm text-muted-foreground">The launcher sits in the corner of every page. Open it to chat.</p>
      <AiChatLauncher className="absolute" title="Ask Ledger" subtitle="Answers from our help centre" unread>
        <div className="flex h-full flex-col">
          <ChatThread className="relative min-h-0 flex-1 overflow-y-auto p-4" messages={messages} typing={typing ? "Ask Ledger" : null} />
          <PromptInput className="border-t border-border p-3" onSubmit={send} placeholder="Ask a question" />
        </div>
      </AiChatLauncher>
    </div>
  );
}
