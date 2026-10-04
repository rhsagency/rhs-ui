"use client";

import { StoreLocator } from "@rhs-ui/commerce/store-locator";

const map = (
  <svg viewBox="0 0 400 400" className="size-full text-foreground" aria-hidden="true">
    <rect width="400" height="400" fill="currentColor" fillOpacity="0.04" />
    {Array.from({ length: 9 }, (_, i) => <line key={`h${i}`} x1="0" x2="400" y1={i * 50} y2={i * 50 + 20} stroke="currentColor" strokeOpacity="0.08" strokeWidth="6" />)}
    {Array.from({ length: 9 }, (_, i) => <line key={`v${i}`} y1="0" y2="400" x1={i * 50} x2={i * 50 - 25} stroke="currentColor" strokeOpacity="0.08" strokeWidth="4" />)}
    {[[120, 140], [250, 210], [190, 300]].map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="9" fill="currentColor" />)}
  </svg>
);

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-5xl p-8">
      <StoreLocator
        map={map}
        stores={[
          { id: "ams", name: "Ledger Store Amsterdam", address: "Haarlemmerstraat 112", city: "Amsterdam", hours: "Open until 18:00", open: true, distance: "1.2 km", phone: "+31 20 123 4567", directionsHref: "#directions-ams", services: ["Pick-up", "Repairs"] },
          { id: "utr", name: "Ledger Store Utrecht", address: "Oudegracht 210", city: "Utrecht", hours: "Opens Tuesday at 10:00", open: false, distance: "34 km", directionsHref: "#directions-utr", services: ["Pick-up"] },
          { id: "rtm", name: "Ledger Store Rotterdam", address: "Witte de Withstraat 45", city: "Rotterdam", hours: "Open until 20:00", open: true, distance: "58 km", phone: "+31 10 987 6543", directionsHref: "#directions-rtm", services: ["Pick-up", "Workshops"] },
        ]}
      />
    </div>
  );
}
