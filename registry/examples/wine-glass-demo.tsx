"use client";
import { ModelViewer } from "@rhs-ui/models/model-viewer";
import { wineGlass } from "@rhs-ui/models/wine-glass";
export default function ModelDemo(): React.JSX.Element { return <div className="w-full max-w-sm p-4"><ModelViewer model={wineGlass} /></div>; }
