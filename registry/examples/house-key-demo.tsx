"use client";
import { ModelViewer } from "@rhs-ui/models/model-viewer";
import { houseKey } from "@rhs-ui/models/house-key";
export default function ModelDemo(): React.JSX.Element { return <div className="w-full max-w-sm p-4"><ModelViewer model={houseKey} /></div>; }
