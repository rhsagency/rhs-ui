"use client";
import { ModelViewer } from "@rhs-ui/models/model-viewer";
import { suitcase } from "@rhs-ui/models/suitcase";
export default function ModelDemo(): React.JSX.Element { return <div className="w-full max-w-sm p-4"><ModelViewer model={suitcase} /></div>; }
