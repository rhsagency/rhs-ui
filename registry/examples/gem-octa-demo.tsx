"use client";
import { ModelViewer } from "@rhs-ui/models/model-viewer";
import { gemOcta } from "@rhs-ui/models/gem-octa";
export default function ModelDemo(): React.JSX.Element { return <div className="w-full max-w-sm p-4"><ModelViewer model={gemOcta} /></div>; }
