"use client";
import { useEffect, useRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface BackgroundCanvasProps extends HTMLAttributes<HTMLDivElement> { pattern: "dots" | "contours" | "orbits" | "grid"; paused?: boolean; speed?: number }
/** Decorative canvas. Sleeps offscreen and in hidden tabs; reduced motion renders one frame. */
export function BackgroundCanvas({ pattern, paused = false, speed = 0.45, className, children, ...props }: BackgroundCanvasProps): React.JSX.Element {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    let width = 1, height = 1, frame = 0, visible = false, time = 0, previous = 0;
    const rate = Number.isFinite(speed) ? Math.max(0, Math.min(2, speed)) : 0.45;
    const render = (): void => {
      ctx.clearRect(0, 0, width, height);
      ctx.strokeStyle = ctx.fillStyle = getComputedStyle(canvas).color;
      ctx.lineWidth = 1;
      if (pattern === "dots") {
        for (let x = 12; x < width; x += 19) for (let y = 12; y < height; y += 19) {
          const distance = Math.hypot(x - width * .58, (y - height * .5) * 1.4);
          const wave = (Math.sin(distance * .025 - time) + 1) * .5;
          ctx.globalAlpha = .12 + wave * .38; ctx.beginPath(); ctx.arc(x, y, .65 + wave * 1.25, 0, Math.PI * 2); ctx.fill();
        }
      } else if (pattern === "contours") {
        ctx.globalAlpha = .28;
        for (let line = 0; line < 28; line++) {
          ctx.beginPath();
          for (let x = -20; x <= width + 20; x += 6) {
            const y = height * .5 + (line - 14) * 12 + Math.sin(x / width * 5 + time * .25 + line * .12) * height * .16 + Math.cos(x / width * 9 - time * .2) * 12;
            if (x === -20) ctx.moveTo(x,y); else ctx.lineTo(x,y);
          }
          ctx.stroke();
        }
      } else if (pattern === "orbits") {
        for (let i = 0; i < 12; i++) {
          ctx.globalAlpha = .1 + i * .017; ctx.beginPath();
          ctx.ellipse(width * .55, height * .5, width * (.08 + i * .023), height * (.15 + i * .025), -.45 + Math.sin(time * .12) * .2, 0, Math.PI * 2); ctx.stroke();
        }
        for (let i = 0; i < 4; i++) {
          const angle = time * .2 + i * 1.6;
          ctx.globalAlpha = .7; ctx.beginPath(); ctx.arc(width * .55 + Math.cos(angle) * width * .24, height * .5 + Math.sin(angle) * height * .32, 2.5, 0, Math.PI * 2); ctx.fill();
        }
      } else {
        ctx.globalAlpha = .22;
        const horizon = height * .23;
        for (let i = -14; i <= 14; i++) { ctx.beginPath(); ctx.moveTo(width * .5 + i * 16, horizon); ctx.lineTo(width * .5 + i * 90, height); ctx.stroke(); }
        for (let i = 0; i < 14; i++) { const position = ((i / 14 + time * .018) % 1); const y = horizon + position * position * (height - horizon); ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(width,y); ctx.stroke(); }
      }
      ctx.globalAlpha = 1;
      canvas.dataset.frame = String(Math.round(time * 1000));
    };
    const tick = (now: number): void => {
      frame = 0;
      if (!visible || document.hidden || reduced.matches || paused || rate === 0) { canvas.dataset.running = "false"; return; }
      if (now - previous >= 32) { time += Math.min((now - previous) / 1000, .05) * rate; previous = now; render(); }
      canvas.dataset.running = "true"; frame = requestAnimationFrame(tick);
    };
    const refresh = (): void => { cancelAnimationFrame(frame); frame = 0; previous = performance.now(); render(); tick(previous); };
    const resize = new ResizeObserver(() => {
      const box = canvas.getBoundingClientRect(); width = Math.max(1,box.width); height = Math.max(1,box.height);
      const ratio = Math.min(devicePixelRatio, 1.5); canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio); ctx.setTransform(ratio,0,0,ratio,0,0); refresh();
    });
    resize.observe(canvas);
    const observer = new IntersectionObserver(([entry]) => { visible = Boolean(entry?.isIntersecting); refresh(); }); observer.observe(canvas);
    const theme = new MutationObserver(refresh); theme.observe(document.documentElement,{attributes:true,attributeFilter:["class","style"]});
    reduced.addEventListener("change",refresh); document.addEventListener("visibilitychange",refresh);
    return () => { cancelAnimationFrame(frame); resize.disconnect(); observer.disconnect(); theme.disconnect(); reduced.removeEventListener("change",refresh); document.removeEventListener("visibilitychange",refresh); };
  }, [pattern, paused, speed]);
  return <div data-slot="background-canvas" className={cn("relative isolate overflow-hidden",className)} {...props}><canvas ref={ref} aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 size-full" />{children}</div>;
}
