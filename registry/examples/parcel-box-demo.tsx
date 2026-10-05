"use client";
import { ModelViewer } from "@rhs-ui/models/model-viewer";
import { parcelBox } from "@rhs-ui/models/parcel-box";
export default function ModelDemo(): React.JSX.Element { return <div className="w-full max-w-sm p-4"><ModelViewer model={parcelBox} /></div>; }
