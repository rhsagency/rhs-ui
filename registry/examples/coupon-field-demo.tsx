"use client";

import { CouponField } from "@rhs-ui/commerce/coupon-field";

const CODES: Record<string, string> = { WELCOME10: "10% off your first order", FREESHIP: "Free shipping" };

export default function CouponFieldDemo() {
  return (
    <div className="grid w-full max-w-sm gap-2">
      <CouponField
        onApply={async (code) => {
          await new Promise((resolve) => setTimeout(resolve, 500));
          return CODES[code] ? { ok: true, message: CODES[code] } : { ok: false, message: `${code} is not a valid code.` };
        }}
      />
      <p className="text-xs text-muted-foreground">Try WELCOME10 or FREESHIP.</p>
    </div>
  );
}
