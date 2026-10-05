"use client";
import { ModelViewer } from "@rhs-ui/models/model-viewer";
import { apple } from "@rhs-ui/models/apple";
export default function ModelDemo(): React.JSX.Element { return <div className="w-full max-w-sm p-4"><ModelViewer model={apple} /></div>; }
