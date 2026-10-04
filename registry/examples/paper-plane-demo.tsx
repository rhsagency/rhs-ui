"use client";
import { ModelViewer } from "@rhs-ui/models/model-viewer";
import { paperPlane } from "@rhs-ui/models/paper-plane";
export default function ModelDemo(): React.JSX.Element { return <div className="w-full max-w-sm p-4"><ModelViewer model={paperPlane} /></div>; }
