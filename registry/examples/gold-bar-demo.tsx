"use client";
import { ModelViewer } from "@rhs-ui/models/model-viewer";
import { goldBar } from "@rhs-ui/models/gold-bar";
export default function ModelDemo(): React.JSX.Element { return <div className="w-full max-w-sm p-4"><ModelViewer model={goldBar} /></div>; }
