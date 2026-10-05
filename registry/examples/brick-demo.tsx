"use client";
import { ModelViewer } from "@rhs-ui/models/model-viewer";
import { brick } from "@rhs-ui/models/brick";
export default function ModelDemo(): React.JSX.Element { return <div className="w-full max-w-sm p-4"><ModelViewer model={brick} /></div>; }
