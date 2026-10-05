"use client";
import { ModelViewer } from "@rhs-ui/models/model-viewer";
import { tennisBall } from "@rhs-ui/models/tennis-ball";
export default function ModelDemo(): React.JSX.Element { return <div className="w-full max-w-sm p-4"><ModelViewer model={tennisBall} /></div>; }
