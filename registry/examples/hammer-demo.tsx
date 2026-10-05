"use client";
import { ModelViewer } from "@rhs-ui/models/model-viewer";
import { hammer } from "@rhs-ui/models/hammer";
export default function ModelDemo(): React.JSX.Element { return <div className="w-full max-w-sm p-4"><ModelViewer model={hammer} /></div>; }
