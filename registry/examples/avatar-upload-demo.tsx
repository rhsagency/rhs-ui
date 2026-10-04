"use client";

import { useState } from "react";

import { AvatarUpload } from "@rhs-ui/primitives/avatar-upload";

export default function Demo(): React.JSX.Element {
  const [url, setUrl] = useState<string | null>(null);
  return (
    <div className="mx-auto max-w-md p-8">
      <AvatarUpload value={url} initials="AW" onFile={(file) => new Promise<void>((resolve) => setTimeout(() => { setUrl(URL.createObjectURL(file)); resolve(); }, 800))} onRemove={() => setUrl(null)} />
    </div>
  );
}
