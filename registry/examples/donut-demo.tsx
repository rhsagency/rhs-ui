"use client";
import { ModelViewer } from "@rhs-ui/models/model-viewer";
import { donut } from "@rhs-ui/models/donut";
export default function ModelDemo(): React.JSX.Element { return <div className="w-full max-w-sm p-4"><ModelViewer model={donut} /></div>; }
