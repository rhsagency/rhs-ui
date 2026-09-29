"use client";

import { useState } from "react";

import { ChatThread, type ChatMessage } from "@rhs-ui/application/chat-thread";
import { Button } from "@rhs-ui/primitives/button";

const START: ChatMessage[] = [
  { id: "1", author: "sam", name: "Sam Okafor", body: "Morning! Did the new pricing page go live?" },
  { id: "2", author: "sam", name: "Sam Okafor", body: "The annual toggle looked great in staging.", time: "09:12" },
  { id: "3", author: "me", name: "You", body: "It shipped last night. Conversion is up a little already." },
  { id: "4", author: "me", name: "You", body: "I'll send the numbers after lunch.", time: "09:14", state: "sent" },
  { id: "5", author: "sam", name: "Sam Okafor", body: "Perfect, thanks 🙌", time: "09:15" },
];

export default function ChatThreadDemo() {
  const [messages, setMessages] = useState(START);
  const [typing, setTyping] = useState<string | null>(null);
  const reply = () => {
    setMessages((current) => [...current, { id: String(current.length + 1), author: "me", name: "You", body: "Numbers are in: +6% on annual plans.", time: "09:16", state: "sending" }]);
    setTyping("Sam");
    setTimeout(() => {
      setMessages((current) => current.map((message, index) => (index === current.length - 1 ? { ...message, state: "sent" } : message)));
    }, 700);
    setTimeout(() => {
      setTyping(null);
      setMessages((current) => [...current, { id: String(current.length + 1), author: "sam", name: "Sam Okafor", body: "Huge. Let's tell the team.", time: "09:17" }]);
    }, 2200);
  };
  return (
    <div className="grid w-full max-w-md gap-4">
      <ChatThread messages={messages} typing={typing} className="rounded-xl border border-border p-4" />
      <Button variant="outline" size="sm" className="justify-self-start" onClick={reply} disabled={messages.length > START.length}>
        Send the numbers
      </Button>
    </div>
  );
}
