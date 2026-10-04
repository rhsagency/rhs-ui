"use client";
import { ModelViewer } from "@rhs-ui/models/model-viewer";
import { pillCapsule } from "@rhs-ui/models/pill-capsule";
export default function ModelDemo(): React.JSX.Element { return <div className="w-full max-w-sm p-4"><ModelViewer model={pillCapsule} /></div>; }
