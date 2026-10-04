"use client";
import { ModelViewer } from "@rhs-ui/models/model-viewer";
import { stackedRings } from "@rhs-ui/models/stacked-rings";
export default function ModelDemo(): React.JSX.Element { return <div className="w-full max-w-sm p-4"><ModelViewer model={stackedRings} /></div>; }
