"use client";
import { ModelViewer } from "@rhs-ui/models/model-viewer";
import { satinPebble } from "@rhs-ui/models/satin-pebble";
export default function ModelDemo(): React.JSX.Element { return <div className="w-full max-w-sm p-4"><ModelViewer model={satinPebble} /></div>; }
