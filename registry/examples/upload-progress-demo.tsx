"use client";

import { useEffect, useState } from "react";

import { UploadProgress, type UploadItem } from "@rhs-ui/primitives/upload-progress";

const START: UploadItem[] = [
  { id: "1", name: "brand-guide.pdf", size: 4_200_000, progress: 1, status: "done" },
  { id: "2", name: "launch-video.mp4", size: 86_000_000, progress: 0.42, status: "uploading" },
  { id: "3", name: "photos.zip", size: 31_000_000, progress: 0, status: "failed", error: "Larger than 25 MB. Split it or upgrade." },
  { id: "4", name: "notes.docx", size: 180_000, progress: 0, status: "queued" },
];

export default function Demo(): React.JSX.Element {
  const [items, setItems] = useState(START);
  useEffect(() => {
    const timer = setInterval(() => setItems((list) => list.map((item) => (item.status === "uploading" ? (item.progress >= 1 ? { ...item, status: "done" } : { ...item, progress: Math.min(1, item.progress + 0.08) }) : item))), 500);
    return () => clearInterval(timer);
  }, []);
  return (
    <div className="mx-auto max-w-md p-8">
      <UploadProgress
        items={items}
        onCancel={(id) => setItems((list) => list.filter((item) => item.id !== id))}
        onRetry={(id) => setItems((list) => list.map((item) => (item.id === id ? { ...item, status: "uploading", progress: 0, error: undefined } : item)))}
      />
    </div>
  );
}
