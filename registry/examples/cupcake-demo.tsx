"use client";
import { ModelViewer } from "@rhs-ui/models/model-viewer";
import { cupcake } from "@rhs-ui/models/cupcake";
export default function ModelDemo(): React.JSX.Element { return <div className="w-full max-w-sm p-4"><ModelViewer model={cupcake} /></div>; }
