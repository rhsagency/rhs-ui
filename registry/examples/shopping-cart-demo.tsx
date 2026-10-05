"use client";
import { ModelViewer } from "@rhs-ui/models/model-viewer";
import { shoppingCart } from "@rhs-ui/models/shopping-cart";
export default function ModelDemo(): React.JSX.Element { return <div className="w-full max-w-sm p-4"><ModelViewer model={shoppingCart} /></div>; }
