"use client";
import { ModelViewer } from "@rhs-ui/models/model-viewer";
import { pencil } from "@rhs-ui/models/pencil";
export default function ModelDemo(): React.JSX.Element { return <div className="w-full max-w-sm p-4"><ModelViewer model={pencil} /></div>; }
