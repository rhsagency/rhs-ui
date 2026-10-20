"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { OrderCard, type OrderCardOrder } from "@rhs-ui/commerce/order-card";
import { OrderLookup, type OrderLookupValues } from "@rhs-ui/commerce/order-lookup";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const pic = (bg: string, body: string) =>
  "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'><rect width='120' height='120' fill='${bg}'/>${body}</svg>`);

const ORDER: OrderCardOrder = {
  id: "20418",
  number: "NW-20418",
  placedAt: "2026-10-18T14:20:00Z",
  status: "shipped",
  items: [
    { id: "shirt", name: "Linen shirt", image: pic("#e9e5dc", "<path d='M42 26l-22 12 8 18 12-6v46h48V50l12 6 8-18-22-12c-4 8-10 12-18 12s-14-4-18-12z' fill='#9a8f7a'/>") },
    { id: "mug", name: "Stoneware mug", image: pic("#efe8df", "<path d='M32 42h46v34a16 16 0 0 1-16 16H48a16 16 0 0 1-16-16z' fill='#c4694a'/><path d='M78 50h6a11 11 0 0 1 0 22h-6' fill='none' stroke='#c4694a' stroke-width='6'/>") },
  ],
  total: 9660,
  deliveryDate: "2026-10-22",
};

/** A stand-in for your order endpoint: one order exists, and only the right email opens it. */
async function findByEmail({ orderNumber, email }: OrderLookupValues): Promise<ReactNode | null> {
  await wait(800);
  if (orderNumber !== "NW-20418" || email?.toLowerCase() !== "mila.devries@example.com") return null;
  return <OrderCard order={ORDER} href="#" currency="EUR" locale="en-GB" />;
}

/** Presses the form's own submit once after it mounts, so the second example opens on its answer. */
function SubmitOnce({ children }: { children: ReactNode }): React.JSX.Element {
  const wrapper = useRef<HTMLDivElement>(null);
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    wrapper.current?.querySelector("form")?.requestSubmit();
  }, []);
  return <div ref={wrapper}>{children}</div>;
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-4xl items-start gap-x-14 gap-y-12 md:grid-cols-2">
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-4">
        <p className="text-xs text-muted-foreground">Try it: these details find the order. Change the email to see the answer for a wrong one.</p>
        <OrderLookup
          onLookup={findByEmail}
          defaultValues={{ orderNumber: "NW-20418", email: "mila.devries@example.com" }}
          orderNumberPattern={/^NW-\d{5}$/}
          orderNumberHelp="Starts with NW- and is in your confirmation email."
          helperText={
            <>
              Have an account?{" "}
              <a href="#" className="rounded-sm font-medium text-foreground underline underline-offset-4 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40">
                Sign in
              </a>{" "}
              to see every order.
            </>
          }
        />
      </div>
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-4">
        <p className="text-xs text-muted-foreground">By postcode, after a wrong guess. A missing order and a wrong postcode get the same words.</p>
        <SubmitOnce>
          <OrderLookup
            fields={["postcode"]}
            title="Track a parcel"
            description="Use the number on your dispatch email and the postcode you ordered to."
            submitLabel="Track my parcel"
            onLookup={async () => {
              await wait(150);
              return null;
            }}
            defaultValues={{ orderNumber: "NW-20999", postcode: "1017 AB" }}
            orderNumberHelp="It is in your dispatch email."
          />
        </SubmitOnce>
      </div>
    </div>
  );
}
