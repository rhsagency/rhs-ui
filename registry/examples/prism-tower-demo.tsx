"use client";
import { ModelViewer } from "@rhs-ui/models/model-viewer";
import { prismTower } from "@rhs-ui/models/prism-tower";
export default function ModelDemo(): React.JSX.Element { return <div className="w-full max-w-sm p-4"><ModelViewer model={prismTower} /></div>; }
