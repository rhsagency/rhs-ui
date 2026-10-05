"use client";
import { ModelViewer } from "@rhs-ui/models/model-viewer";
import { pillBottle } from "@rhs-ui/models/pill-bottle";
export default function ModelDemo(): React.JSX.Element { return <div className="w-full max-w-sm p-4"><ModelViewer model={pillBottle} /></div>; }
