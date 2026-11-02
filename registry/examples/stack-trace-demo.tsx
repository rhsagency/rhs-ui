import type { ReactNode } from "react";

import { StackTrace } from "@rhs-ui/application/stack-trace";

const REACT = "/Users/mara/northwind-shop/node_modules/react-dom/cjs/react-dom-client.development.js";
const NEXT = "/Users/mara/northwind-shop/node_modules/next/dist/server/app-render/app-render.js";

// The text a browser or Node gives you in `error.stack`: pass the error as it is and the trace reads the frames from it.
const CART_ERROR = {
  name: "TypeError",
  message: "Cannot read properties of undefined (reading 'map')",
  stack: [
    "TypeError: Cannot read properties of undefined (reading 'map')",
    "    at LineItems (/Users/mara/northwind-shop/src/components/cart/line-items.tsx:42:18)",
    `    at renderWithHooks (${REACT}:5654:22)`,
    `    at updateFunctionComponent (${REACT}:8897:19)`,
    `    at beginWork (${REACT}:10522:18)`,
    `    at runWithFiberInDEV (${REACT}:871:30)`,
    `    at performUnitOfWork (${REACT}:15257:22)`,
    `    at workLoopSync (${REACT}:15077:41)`,
    `    at renderRootSync (${REACT}:15057:11)`,
    `    at performWorkOnRoot (${REACT}:14526:35)`,
    "    at CartSummary (/Users/mara/northwind-shop/src/components/cart/cart-summary.tsx:18:7)",
    "    at CartPage (/Users/mara/northwind-shop/src/app/cart/page.tsx:27:5)",
    `    at renderToHTMLOrFlight (${NEXT}:1203:19)`,
    "    at async doRender (/Users/mara/northwind-shop/node_modules/next/dist/server/base-server.js:1698:34)",
    "    at async Server.handleRequest (node:internal/modules/run_main:122:12)",
  ].join("\n"),
};

const DATABASE_ERROR = {
  name: "Error",
  message: "connect ECONNREFUSED 127.0.0.1:5432",
  stack: [
    "Error: connect ECONNREFUSED 127.0.0.1:5432",
    "    at TCPConnectWrap.afterConnect [as oncomplete] (node:net:1637:16)",
    "    at Pool.connect (/srv/northwind-api/node_modules/pg-pool/index.js:45:11)",
    "    at async getOrder (/srv/northwind-api/src/db/orders.ts:31:17)",
    "    at async handler (/srv/northwind-api/src/routes/orders.ts:14:20)",
    "    at async Layer.handle (/srv/northwind-api/node_modules/express/lib/router/layer.js:95:5)",
  ].join("\n"),
};

function Case({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-3xl gap-9">
      <Case caption="Your own frames in full weight, the first one set apart, the eight react-dom frames folded. A file location copies as a click, the button copies the whole trace.">
        <StackTrace error={CART_ERROR} projectRoot="/Users/mara/northwind-shop" />
      </Case>

      <Case caption="Library frames shown from the start with defaultExpanded. Anything in node_modules and Node's own modules counts as library code.">
        <StackTrace error={DATABASE_ERROR} projectRoot="/srv/northwind-api" defaultExpanded />
      </Case>
    </div>
  );
}
