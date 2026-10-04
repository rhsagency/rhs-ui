"use client";

import { useState } from "react";

import { FileTrigger } from "@rhs-ui/primitives/file-trigger";

export default function Demo(): React.JSX.Element {
  const [file, setFile] = useState<File | null>(null);
  return (
    <div className="mx-auto grid max-w-sm gap-3 p-8">
      <p className="text-sm font-medium">Your CV</p>
      <FileTrigger accept=".pdf,.docx" maxSize={5_000_000} label="Choose a PDF or Word file" name="cv" onFileChange={setFile} />
      <p className="text-xs text-muted-foreground">{file ? "Ready to send with the form." : "Up to 5 MB."}</p>
    </div>
  );
}
