"use client";
import { ModelViewer } from "@rhs-ui/models/model-viewer";
import { paintBucket } from "@rhs-ui/models/paint-bucket";
export default function ModelDemo(): React.JSX.Element { return <div className="w-full max-w-sm p-4"><ModelViewer model={paintBucket} /></div>; }
