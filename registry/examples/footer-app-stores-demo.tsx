import { FooterAppStores } from "@rhs-ui/marketing/footer-app-stores";

const GRID = 25;

/** A drawn code for the preview: three finder squares, the timing lines, an alignment square and a fixed scatter of modules. In a real footer this is your own QR image. */
function qrPath(): string {
  let seed = 11;
  const next = () => {
    seed = (seed * 48271) % 2147483647;
    return seed / 2147483647;
  };
  const finders: readonly (readonly [number, number])[] = [
    [0, 0],
    [GRID - 7, 0],
    [0, GRID - 7],
  ];
  const inFinder = (x: number, y: number) => (x < 8 && y < 8) || (x >= GRID - 8 && y < 8) || (x < 8 && y >= GRID - 8);
  const inAlignment = (x: number, y: number) => x >= GRID - 9 && x <= GRID - 5 && y >= GRID - 9 && y <= GRID - 5;
  let path = "";
  for (let y = 0; y < GRID; y += 1) {
    for (let x = 0; x < GRID; x += 1) {
      if (inFinder(x, y) || inAlignment(x, y)) continue;
      // The timing lines run between the finders, one module on and one off.
      const timing = (y === 6 && x > 7 && x < GRID - 8) || (x === 6 && y > 7 && y < GRID - 8);
      if (timing ? (x + y) % 2 === 0 : next() > 0.5) path += `M${x} ${y}h1v1h-1z`;
    }
  }
  for (const [x, y] of finders) path += `M${x} ${y}h7v7h-7zM${x + 1} ${y + 1}h5v5h-5zM${x + 2} ${y + 2}h3v3h-3z`;
  path += `M${GRID - 9} ${GRID - 9}h5v5h-5zM${GRID - 8} ${GRID - 8}h3v3h-3zM${GRID - 7} ${GRID - 7}h1v1h-1z`;
  return path;
}

const QR_PATH = qrPath();

function QrArt(): React.JSX.Element {
  return (
    <svg viewBox={`0 0 ${GRID} ${GRID}`} shapeRendering="crispEdges" aria-hidden="true">
      <path d={QR_PATH} fill="currentColor" fillRule="evenodd" />
    </svg>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto grid max-w-6xl gap-3 px-6 py-6">
      <p className="text-xs leading-relaxed text-muted-foreground">
        Each store button is a link that names the app and the store. From 1024px a QR code sits beside them for visitors at a desk; on a phone the buttons stack at the full width.
      </p>
      <div className="overflow-hidden rounded-xl border border-border bg-background">
        <FooterAppStores
          brand={<span className="text-base font-semibold tracking-tight">Atlas</span>}
          tagline="Maps, tickets and notes for every trip, on your phone and offline."
          appName="Atlas"
          stores={[
            { store: "app-store", href: "#app-store" },
            { store: "google-play", href: "#google-play" },
          ]}
          qr={<QrArt />}
          columns={[
            {
              title: "Product",
              links: [
                { label: "Offline maps", href: "#maps" },
                { label: "Trip planner", href: "#planner" },
                { label: "Pricing", href: "#pricing" },
                { label: "What's new", href: "#new" },
              ],
            },
            {
              title: "Support",
              links: [
                { label: "Help centre", href: "#help" },
                { label: "Contact us", href: "#contact" },
                { label: "System status", href: "https://example.com/status", external: true },
              ],
            },
            {
              title: "Company",
              links: [
                { label: "About", href: "#about" },
                { label: "Careers", href: "#careers" },
                { label: "Press kit", href: "#press" },
              ],
            },
          ]}
          legal="© 2026 Atlas Labs B.V."
          legalLinks={[
            { label: "Privacy", href: "#privacy" },
            { label: "Terms", href: "#terms" },
            { label: "Cookies", href: "#cookies" },
          ]}
        />
      </div>
    </div>
  );
}
