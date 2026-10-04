"use client";

import { useState } from "react";

import { MentionTextarea } from "@rhs-ui/primitives/mention-textarea";

export default function Demo(): React.JSX.Element {
  const [text, setText] = useState("Looks good to me. @");
  return (
    <div className="mx-auto max-w-md p-8 pb-56">
      <MentionTextarea
        label="Comment"
        value={text}
        onValueChange={setText}
        placeholder="Type @ to mention someone"
        people={[
          { id: "1", name: "Anouk de Wit", detail: "Leadership" },
          { id: "2", name: "Sara Haddad", detail: "Support" },
          { id: "3", name: "Luca Romano", detail: "Engineering" },
          { id: "4", name: "Mei Tanaka", detail: "Design" },
          { id: "5", name: "Daan Peters", detail: "Engineering" },
        ]}
      />
    </div>
  );
}
