"use client";
import { ModelViewer } from "@rhs-ui/models/model-viewer";
import { ribbonKnot } from "@rhs-ui/models/ribbon-knot";
export default function ModelDemo(): React.JSX.Element { return <div className="w-full max-w-sm p-4"><ModelViewer model={ribbonKnot} /></div>; }
