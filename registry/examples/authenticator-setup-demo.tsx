"use client";

import { AuthenticatorSetup } from "@rhs-ui/application/authenticator-setup";
import { IconArrowRight } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";

/**
 * A stand-in for a real QR code, drawn as SVG: finder squares, timing lines and
 * a pattern that is the same on every render. In your app, draw the code from
 * the otpauth address with a QR library and pass its SVG or image the same way.
 */
function SampleQr(): React.JSX.Element {
  const size = 29;
  let seed = 20261020;
  const random = () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const finder = (x: number, y: number) => {
    for (let dy = 0; dy < 7; dy += 1) {
      for (let dx = 0; dx < 7; dx += 1) {
        const edge = dx === 0 || dx === 6 || dy === 0 || dy === 6;
        const core = dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4;
        if (edge || core) cells.add(`${x + dx},${y + dy}`);
      }
    }
  };
  const cells = new Set<string>();
  const reserved = (x: number, y: number) => (x < 8 && y < 8) || (x >= size - 8 && y < 8) || (x < 8 && y >= size - 8);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      if (reserved(x, y)) continue;
      const timing = (x === 6 && y % 2 === 0) || (y === 6 && x % 2 === 0);
      if (timing || (x !== 6 && y !== 6 && random() > 0.52)) cells.add(`${x},${y}`);
    }
  }
  finder(0, 0);
  finder(size - 7, 0);
  finder(0, size - 7);
  const path = [...cells].map((cell) => `M${cell.split(",")[0]} ${cell.split(",")[1]}h1v1h-1z`).join("");
  return (
    <svg viewBox={`-1 -1 ${size + 2} ${size + 2}`} shapeRendering="crispEdges" fill="currentColor">
      <path d={path} />
    </svg>
  );
}

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto w-full max-w-xl px-4 py-12 sm:px-6">
      <p className="mb-4 text-xs text-muted-foreground">In this preview the code 123456 is accepted. The QR code is a stand-in.</p>
      <AuthenticatorSetup
        qr={<SampleQr />}
        secret="JBSWY3DPEHPK3PXP"
        issuer="Kestrel"
        accountLabel="ada@northwind.example"
        otpauthUri="otpauth://totp/Kestrel:ada%40northwind.example?secret=JBSWY3DPEHPK3PXP&issuer=Kestrel"
        onVerify={async (code) => {
          await wait(700);
          return code === "123456";
        }}
        onCancel={() => undefined}
        next={
          <Button>
            Save your recovery codes
            <IconArrowRight />
          </Button>
        }
      />
    </div>
  );
}
