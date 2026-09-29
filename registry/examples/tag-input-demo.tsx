"use client";

import { useState } from "react";

import { Label } from "@rhs-ui/primitives/label";
import { TagInput } from "@rhs-ui/primitives/tag-input";

export default function Demo(): React.JSX.Element {
  const [emails, setEmails] = useState<string[]>(["ines@orbit.example"]);
  return (
    <div className="grid w-full max-w-md gap-2">
      <Label htmlFor="invite">Invite by email</Label>
      <TagInput
        id="invite"
        value={emails}
        onValueChange={setEmails}
        max={5}
        placeholder="name@company.com"
        validate={(tag) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(tag) ? undefined : `${tag} is not an email address.`)}
      />
      <p className="text-xs text-muted-foreground">
        {emails.length} of 5 invites. Press Enter or type a comma after each address.
      </p>
    </div>
  );
}
