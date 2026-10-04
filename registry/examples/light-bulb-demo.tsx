"use client";
import { ModelViewer } from "@rhs-ui/models/model-viewer";
import { lightBulb } from "@rhs-ui/models/light-bulb";
export default function ModelDemo(): React.JSX.Element { return <div className="w-full max-w-sm p-4"><ModelViewer model={lightBulb} /></div>; }
