"use client";
import { ModelViewer } from "@rhs-ui/models/model-viewer";
import { basketball } from "@rhs-ui/models/basketball";
export default function ModelDemo(): React.JSX.Element { return <div className="w-full max-w-sm p-4"><ModelViewer model={basketball} /></div>; }
