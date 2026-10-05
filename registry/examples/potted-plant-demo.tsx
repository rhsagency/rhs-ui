"use client";
import { ModelViewer } from "@rhs-ui/models/model-viewer";
import { pottedPlant } from "@rhs-ui/models/potted-plant";
export default function ModelDemo(): React.JSX.Element { return <div className="w-full max-w-sm p-4"><ModelViewer model={pottedPlant} /></div>; }
