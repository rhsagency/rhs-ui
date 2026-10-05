"use client";
import { ModelViewer } from "@rhs-ui/models/model-viewer";
import { tooth } from "@rhs-ui/models/tooth";
export default function ModelDemo(): React.JSX.Element { return <div className="w-full max-w-sm p-4"><ModelViewer model={tooth} /></div>; }
