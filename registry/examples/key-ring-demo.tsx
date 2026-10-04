"use client";
import { ModelViewer } from "@rhs-ui/models/model-viewer";
import { keyRing } from "@rhs-ui/models/key-ring";
export default function ModelDemo(): React.JSX.Element { return <div className="w-full max-w-sm p-4"><ModelViewer model={keyRing} /></div>; }
