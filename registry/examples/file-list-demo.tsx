"use client";

import { useState } from "react";

import { FileList, type FileListItem } from "@rhs-ui/application/file-list";

export default function Demo(): React.JSX.Element {
  const [files, setFiles] = useState<FileListItem[]>([
    { id: "1", name: "brand-guidelines.pdf", size: 4_820_000 },
    { id: "2", name: "hero-photo.jpg", size: 2_310_000, progress: 64 },
    { id: "3", name: "pricing-2026.xlsx", size: 88_000, error: "Upload failed. The connection dropped." },
  ]);
  return (
    <div className="mx-auto max-w-lg p-6">
      <FileList
        files={files}
        onRemove={(id) => setFiles((current) => current.filter((file) => file.id !== id))}
        onRetry={(id) => setFiles((current) => current.map((file) => (file.id === id ? { ...file, error: undefined, progress: 10 } : file)))}
      />
    </div>
  );
}
