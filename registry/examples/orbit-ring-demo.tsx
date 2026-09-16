"use client";
import { ModelViewer } from "@rhs-ui/models/model-viewer";
import { orbitRing } from "@rhs-ui/models/orbit-ring";
export default function ModelDemo(): React.JSX.Element { return <div className="w-full max-w-sm p-4"><ModelViewer model={orbitRing} /></div>; }
