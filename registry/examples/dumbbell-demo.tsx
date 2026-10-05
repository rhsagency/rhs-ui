"use client";
import { ModelViewer } from "@rhs-ui/models/model-viewer";
import { dumbbell } from "@rhs-ui/models/dumbbell";
export default function ModelDemo(): React.JSX.Element { return <div className="w-full max-w-sm p-4"><ModelViewer model={dumbbell} /></div>; }
