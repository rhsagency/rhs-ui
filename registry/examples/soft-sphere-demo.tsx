"use client";
import { ModelViewer } from "@rhs-ui/models/model-viewer";
import { softSphere } from "@rhs-ui/models/soft-sphere";
export default function ModelDemo(): React.JSX.Element { return <div className="w-full max-w-sm p-4"><ModelViewer model={softSphere} /></div>; }
