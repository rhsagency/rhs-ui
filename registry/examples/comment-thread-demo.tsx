"use client";

import { useState } from "react";

import { CommentThread, type Comment } from "@rhs-ui/application/comment-thread";

const START: Comment[] = [
  {
    id: "c1",
    author: "Nora Visser",
    time: "2 h ago",
    text: "Can we move the pricing table above the FAQ? Most questions are about plans.",
    replies: [{ id: "c1r1", author: "Daan Mulder", time: "1 h ago", text: "Agreed. I'll try it in the next build." }],
  },
  { id: "c2", author: "Ines Costa", time: "35 min ago", text: "The hero copy is much clearer now. Ship it." },
];

export default function CommentThreadDemo() {
  const [comments, setComments] = useState(START);
  return (
    <CommentThread
      comments={comments}
      me="Alex Kim"
      className="w-full max-w-lg"
      onPost={(text, replyTo) => {
        const comment = { id: `n${Date.now()}`, author: "Alex Kim", time: "Just now", text };
        setComments((current) =>
          replyTo ? current.map((entry) => (entry.id === replyTo ? { ...entry, replies: [...(entry.replies ?? []), comment] } : entry)) : [...current, comment],
        );
      }}
    />
  );
}
