"use client";
import { ModelViewer } from "@rhs-ui/models/model-viewer";
import { coinBlank } from "@rhs-ui/models/coin-blank";
export default function ModelDemo(): React.JSX.Element { return <div className="w-full max-w-sm p-4"><ModelViewer model={coinBlank} /></div>; }
