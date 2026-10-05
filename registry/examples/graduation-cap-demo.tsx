"use client";
import { ModelViewer } from "@rhs-ui/models/model-viewer";
import { graduationCap } from "@rhs-ui/models/graduation-cap";
export default function ModelDemo(): React.JSX.Element { return <div className="w-full max-w-sm p-4"><ModelViewer model={graduationCap} /></div>; }
