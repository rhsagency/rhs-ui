"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";

import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

export interface SignaturePadProps {
  /** Called with a PNG data URL when the person finishes a stroke, or null when cleared. */
  onValueChange: (dataUrl: string | null) => void;
  label?: string;
  /** A typed name as the accessible alternative to drawing. */
  allowTyped?: boolean;
  className?: string;
}

/**
 * Sign with a mouse, a finger or a pen: smooth strokes on a canvas sized to
 * the device, a clear button, and an optional "type your name instead" for
 * people who cannot draw, which is also what a screen reader user gets.
 */
export function SignaturePad({ onValueChange, label = "Signature", allowTyped = true, className }: SignaturePadProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const last = useRef<{ x: number; y: number } | null>(null);
  const [empty, setEmpty] = useState(true);
  const [typed, setTyped] = useState(false);
  const [name, setName] = useState("");
  useEffect(() => {
    const node = canvas.current;
    if (!node) return;
    const ratio = window.devicePixelRatio || 1;
    const box = node.getBoundingClientRect();
    node.width = box.width * ratio;
    node.height = box.height * ratio;
    const ctx = node.getContext("2d");
    if (!ctx) return;
    ctx.scale(ratio, ratio);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 2.2;
    ctx.strokeStyle = getComputedStyle(node).color;
  }, [typed]);
  function point(event: PointerEvent<HTMLCanvasElement>) {
    const box = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - box.left, y: event.clientY - box.top };
  }
  function down(event: PointerEvent<HTMLCanvasElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    last.current = point(event);
  }
  function move(event: PointerEvent<HTMLCanvasElement>) {
    const ctx = canvas.current?.getContext("2d");
    if (!ctx || !last.current) return;
    const next = point(event);
    const mid = { x: (last.current.x + next.x) / 2, y: (last.current.y + next.y) / 2 };
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.quadraticCurveTo(last.current.x, last.current.y, mid.x, mid.y);
    ctx.stroke();
    last.current = next;
    setEmpty(false);
  }
  function up() {
    last.current = null;
    if (canvas.current && !empty) onValueChange(canvas.current.toDataURL("image/png"));
  }
  function clear() {
    const node = canvas.current;
    node?.getContext("2d")?.clearRect(0, 0, node.width, node.height);
    setEmpty(true);
    onValueChange(null);
  }
  return (
    <div data-slot="signature-pad" className={cn("grid gap-2", className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        {allowTyped ? <button type="button" className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline" onClick={() => { setTyped(!typed); clear(); }}>{typed ? "Draw instead" : "Type your name instead"}</button> : null}
      </div>
      {typed ? (
        <input aria-label={`${label}, typed name`} value={name} onChange={(event) => { setName(event.target.value); onValueChange(event.target.value ? `typed:${event.target.value}` : null); }} placeholder="Your full name" className="h-28 w-full rounded-xl border border-dashed border-border bg-background px-4 text-center font-serif text-3xl italic outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40" />
      ) : (
        <div className="relative">
          <canvas ref={canvas} aria-label={`${label}, draw with mouse, finger or pen`} role="img" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} className="h-28 w-full touch-none rounded-xl border border-dashed border-border bg-background text-foreground" />
          {empty ? <span aria-hidden="true" className="pointer-events-none absolute inset-x-6 bottom-6 border-b border-border text-xs text-muted-foreground">Sign above the line</span> : null}
        </div>
      )}
      <div className="flex justify-end"><Button type="button" size="sm" variant="ghost" onClick={clear} disabled={typed ? !name : empty}>Clear</Button></div>
    </div>
  );
}
