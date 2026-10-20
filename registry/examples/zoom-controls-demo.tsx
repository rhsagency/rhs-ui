"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";

import { Kbd, KbdGroup } from "@rhs-ui/primitives/kbd";
import { ZoomControls } from "@rhs-ui/primitives/zoom-controls";
import { cn } from "@/lib/utils";

const MAP_W = 960;
const MAP_H = 600;
const ROADS_X = [0, 220, 360, 540, 700];
const ROADS_Y = [0, 150, 290, 440, 600];

/** A harbour district drawn as lines and blocks: enough detail that zooming in has something to show. */
function HarbourMap(): React.JSX.Element {
  const cells: { x: number; y: number; w: number; h: number; park: boolean; col: number; row: number }[] = [];
  for (let row = 0; row < ROADS_Y.length - 1; row += 1) {
    for (let col = 0; col < ROADS_X.length - 1; col += 1) {
      const x = (ROADS_X[col] ?? 0) + 14;
      const y = (ROADS_Y[row] ?? 0) + 14;
      cells.push({ x, y, w: (ROADS_X[col + 1] ?? 0) - x - 14, h: (ROADS_Y[row + 1] ?? 0) - y - 14, park: col === 1 && row === 2, col, row });
    }
  }
  return (
    <svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} width={MAP_W} height={MAP_H} className="block text-foreground" role="img" aria-label="Map of the Kestrel Quay district with a harbour on the right">
      <rect width={MAP_W} height={MAP_H} className="fill-background" />
      {/* the harbour */}
      <path d="M820 0H960V600H742C790 530 744 480 786 410S846 292 812 214S790 70 820 0Z" className="fill-foreground/[0.07]" />
      {[70, 120, 170, 330, 380, 470, 520].map((y, index) => (
        <path key={y} d={`M${850 + (index % 3) * 18} ${y}h${46 + (index % 2) * 22}`} className="stroke-foreground/15" strokeWidth="2" strokeLinecap="round" fill="none" />
      ))}
      {/* avenue */}
      <path d="M0 536L700 70" className="stroke-foreground/10" strokeWidth="18" strokeLinecap="round" fill="none" />
      {/* blocks */}
      {cells.map((cell) =>
        cell.park ? (
          <g key={`${cell.col}-${cell.row}`}>
            <rect x={cell.x} y={cell.y} width={cell.w} height={cell.h} rx="14" className="fill-foreground/[0.1] stroke-foreground/25" strokeWidth="1" vectorEffect="non-scaling-stroke" />
            {[0, 1, 2, 3, 4, 5, 6, 7].map((tree) => (
              <circle key={tree} cx={cell.x + 22 + (tree % 4) * 25} cy={cell.y + 36 + Math.floor(tree / 4) * 50} r={7 + (tree % 3) * 2} className="fill-foreground/20" />
            ))}
          </g>
        ) : (
          <g key={`${cell.col}-${cell.row}`}>
            <rect x={cell.x} y={cell.y} width={cell.w} height={cell.h} rx="10" className="fill-foreground/[0.04] stroke-foreground/25" strokeWidth="1" vectorEffect="non-scaling-stroke" />
            <rect x={cell.x + 12} y={cell.y + 12} width={cell.w * 0.46} height={cell.h * 0.42} rx="5" className="fill-foreground/[0.1]" />
            <rect x={cell.x + 12 + cell.w * 0.5} y={cell.y + 12} width={cell.w * 0.5 - 36} height={cell.h * 0.58} rx="5" className="fill-foreground/[0.07]" />
            <rect x={cell.x + 12} y={cell.y + cell.h * 0.5 + 6} width={cell.w * 0.4} height={cell.h * 0.5 - 30} rx="5" className="fill-foreground/[0.07]" />
          </g>
        ),
      )}
      {/* street names */}
      <g className="fill-foreground/55" fontSize="12" fontWeight="500" letterSpacing="0.04em">
        <text x="236" y="146">HARBOUR STREET</text>
        <text x="40" y="286">MILL LANE</text>
        <text x="376" y="436">NORTHWIND ROW</text>
        <text x="556" y="286">KESTREL QUAY</text>
      </g>
      {/* the pin */}
      <g transform="translate(452 200)">
        <circle r="26" className="fill-foreground/10" />
        <circle r="9" className="fill-foreground" />
        <circle r="3.5" className="fill-background" />
        <g transform="translate(18 -60)">
          <rect width="152" height="44" rx="9" className="fill-card stroke-foreground/30" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          <text x="12" y="19" fontSize="12" fontWeight="600" className="fill-foreground">Halcyon Studio</text>
          <text x="12" y="34" fontSize="11" className="fill-foreground/60">Kestrel Quay 12</text>
        </g>
      </g>
    </svg>
  );
}

const clamp = (n: number, low: number, high: number) => Math.min(high, Math.max(low, n));

/** Which way the map moves for each arrow key: the view goes right, so the map goes left. */
const ARROWS: Record<string, readonly [number, number]> = { ArrowLeft: [1, 0], ArrowRight: [-1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] };

function MapViewer(): React.JSX.Element {
  const frame = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 672, h: 420 });
  const [zoom, setZoom] = useState(0.7);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const drag = useRef<{ startX: number; startY: number; panX: number; panY: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const measured = useRef(false);

  // What "fit" means is the viewer's business: the whole map across the width of the frame.
  const fit = Math.round(Math.min(size.w / MAP_W, size.h / MAP_H) * 100) / 100;

  useEffect(() => {
    const element = frame.current;
    if (!element) return;
    const measure = () => {
      const next = { w: element.clientWidth, h: element.clientHeight };
      setSize(next);
      if (!measured.current) {
        measured.current = true;
        setZoom(Math.round(Math.min(next.w / MAP_W, next.h / MAP_H) * 100) / 100);
      }
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // A map never leaves the frame: the pan stops where its edge reaches the edge of the frame.
  const maxX = Math.max(0, (MAP_W * zoom - size.w) / 2);
  const maxY = Math.max(0, (MAP_H * zoom - size.h) / 2);
  const x = clamp(pan.x, -maxX, maxX);
  const y = clamp(pan.y, -maxY, maxY);
  const zoomedIn = zoom > fit + 0.001;

  const down = (event: PointerEvent<HTMLDivElement>) => {
    // The level menu is a portal: React still bubbles its events through the frame, but they are not the map's to pan with.
    const target = event.target as Node;
    if (event.button !== 0 || !event.currentTarget.contains(target) || (target as HTMLElement).closest?.("[data-slot='zoom-controls']")) return;
    drag.current = { startX: event.clientX, startY: event.clientY, panX: x, panY: y };
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
  };
  const move = (event: PointerEvent<HTMLDivElement>) => {
    const start = drag.current;
    if (start) setPan({ x: start.panX + event.clientX - start.startX, y: start.panY + event.clientY - start.startY });
  };
  const up = () => {
    drag.current = null;
    setDragging(false);
  };
  // The arrow keys pan a zoomed map, 40px a press and 160px with Shift. At the fit there is nothing to pan, so they keep scrolling the page.
  const panByKey = (event: KeyboardEvent<HTMLDivElement>) => {
    // Keys from the controls, and from their menu (React bubbles a portal's events through the frame), are not the map's.
    if (event.target !== event.currentTarget || event.altKey || event.ctrlKey || event.metaKey) return;
    const toward = ARROWS[event.key];
    if (!toward || !zoomedIn) return;
    const distance = event.shiftKey ? 160 : 40;
    setPan({ x: clamp(x + toward[0] * distance, -maxX, maxX), y: clamp(y + toward[1] * distance, -maxY, maxY) });
    event.preventDefault();
  };

  return (
    <div
      ref={frame}
      role="group"
      tabIndex={0}
      aria-label="Harbour district map. With the map focused, Ctrl plus and Ctrl minus zoom it, and once it is zoomed in the arrow keys pan it."
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      onKeyDown={panByKey}
      className={cn(
        "relative aspect-[8/5] w-full overflow-hidden rounded-xl border border-border bg-background outline-none select-none focus-visible:ring-[3px] focus-visible:ring-ring/40",
        zoomedIn ? "touch-none" : null,
        dragging ? "cursor-grabbing" : zoomedIn ? "cursor-grab" : null,
      )}
    >
      <div
        className={cn("absolute top-1/2 left-1/2 will-change-transform", dragging ? null : "transition-transform duration-200 ease-out motion-reduce:transition-none")}
        style={{ width: MAP_W, height: MAP_H, transform: `translate(${x}px, ${y}px) translate(-50%, -50%) scale(${zoom})` }}
      >
        <HarbourMap />
      </div>
      <ZoomControls
        value={zoom}
        onValueChange={setZoom}
        min={0.2}
        max={4}
        presets={[25, 50, 100, 200, 400]}
        onFit={() => {
          setZoom(fit);
          setPan({ x: 0, y: 0 });
        }}
        side="top"
        size="sm"
        className="absolute right-3 bottom-3"
      />
    </div>
  );
}

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start justify-items-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

// The rows below only show how the control looks; they own no content.
function noop() {}

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-2xl grid-cols-[minmax(0,1fr)] gap-9">
      <Example caption="Zoom with the buttons or the level menu. Zoomed in, drag the map to pan it, or focus it and use the keys.">
        <MapViewer />
        <div className="grid gap-2 text-xs text-muted-foreground">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
            With the map focused:
            <KbdGroup>
              <Kbd>Ctrl</Kbd>
              <Kbd>+</Kbd>
            </KbdGroup>
            <KbdGroup>
              <Kbd>Ctrl</Kbd>
              <Kbd>−</Kbd>
            </KbdGroup>
            <KbdGroup>
              <Kbd>Ctrl</Kbd>
              <Kbd>0</Kbd>
            </KbdGroup>
            (⌘ on a Mac). Elsewhere the browser keeps its own zoom.
          </p>
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
            Once zoomed in, the arrow keys pan the map:
            <KbdGroup>
              <Kbd>←</Kbd>
              <Kbd>↑</Kbd>
              <Kbd>↓</Kbd>
              <Kbd>→</Kbd>
            </KbdGroup>
            and Shift makes the steps bigger.
          </p>
        </div>
      </Example>

      <Example caption="Three sizes">
        <div className="flex flex-wrap items-center gap-5">
          <ZoomControls size="sm" value={1.5} onValueChange={noop} bindKeys={false} aria-label="Zoom, small" />
          <ZoomControls size="md" value={1.5} onValueChange={noop} bindKeys={false} aria-label="Zoom, medium" />
          <ZoomControls size="lg" value={1.5} onValueChange={noop} bindKeys={false} aria-label="Zoom, large" />
        </div>
      </Example>

      <Example caption="At the limits: the step dims and its tooltip says why">
        <div className="flex flex-wrap items-center gap-5">
          <ZoomControls value={0.25} onValueChange={noop} bindKeys={false} aria-label="Zoom, at the minimum" />
          <ZoomControls value={4} onValueChange={noop} bindKeys={false} aria-label="Zoom, at the maximum" />
        </div>
      </Example>
    </div>
  );
}
