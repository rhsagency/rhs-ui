"use client";
import { ModelViewer } from "@rhs-ui/models/model-viewer";
import { hourglass } from "@rhs-ui/models/hourglass";
export default function ModelDemo(): React.JSX.Element { return <div className="w-full max-w-sm p-4"><ModelViewer model={hourglass} /></div>; }
