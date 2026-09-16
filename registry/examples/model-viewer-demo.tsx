"use client";
import { ModelViewer } from "@rhs-ui/models/model-viewer";
import { softCube } from "@rhs-ui/models/soft-cube";
export default function ModelDemo(): React.JSX.Element { return <div className="w-full max-w-sm p-4"><ModelViewer model={softCube} /></div>; }
