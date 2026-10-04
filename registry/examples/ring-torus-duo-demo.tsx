"use client";
import { ModelViewer } from "@rhs-ui/models/model-viewer";
import { ringTorusDuo } from "@rhs-ui/models/ring-torus-duo";
export default function ModelDemo(): React.JSX.Element { return <div className="w-full max-w-sm p-4"><ModelViewer model={ringTorusDuo} /></div>; }
