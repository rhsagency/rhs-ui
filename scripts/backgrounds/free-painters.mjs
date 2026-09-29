/**
 * The painters of the Free backgrounds added in 0.5, as source text. The
 * generator (generate-backgrounds.mjs) writes each one into
 * registry/backgrounds/<name>.tsx with its component, demo and registry
 * entry; the painter body is the only part that differs between them.
 *
 * Every body gets `ctx, width, height, time` and draws in the current colour
 * (stroke and fill are set to it). Keep them bounded: a few thousand drawing
 * calls a frame at most, because the engine repaints at 30 fps.
 */
export const FREE_BACKGROUNDS = [
  {
    name: "ripple-rings", title: "Ripple Rings", mood: "calm",
    description: "Rings spreading from three points and fading as they cross, like rain on still water.",
    tagline: "Every move, felt.", use: "Wellness, audio, calm product pages",
    body: `
  const sources = [[0.3, 0.4, 0], [0.72, 0.62, 2.1], [0.55, 0.2, 4.2]] as const;
  const reach = Math.hypot(width, height) * 0.45;
  for (const [sx, sy, offset] of sources) {
    for (let k = 0; k < 7; k++) {
      const r = (time * 38 + offset * 40 + k * (reach / 7)) % reach;
      ctx.globalAlpha = Math.max(0, 1 - r / reach) * 0.38;
      ctx.beginPath(); ctx.arc(sx * width, sy * height, r, 0, Math.PI * 2); ctx.stroke();
    }
  }`,
  },
  {
    name: "wave-mesh", title: "Wave Mesh", mood: "technical",
    description: "A wireframe landscape rolling toward you, ridges rising and settling as it comes.",
    tagline: "The ground keeps moving.", use: "Launches, hardware, product reveals",
    body: `
  const rows = 26, cols = 36, horizon = height * 0.28;
  const travel = time * 0.6, shift = Math.floor(travel), fraction = travel - shift;
  const grid: { x: number; y: number; depth: number }[][] = [];
  for (let r = 0; r < rows; r++) {
    const depth = ((r + fraction) / rows) ** 2;
    const row = r - shift;
    const base = horizon + depth * (height - horizon) * 1.05;
    const spread = 0.35 + depth * 1.1;
    grid.push(Array.from({ length: cols + 1 }, (_, c) => {
      const u = c / cols - 0.5;
      const lift = (Math.sin(u * 9 + time * 0.8 + row * 0.35) + Math.cos(u * 4 - time * 0.5 + row * 0.2)) * 18 * depth;
      return { x: width * 0.5 + u * width * spread, y: base - lift, depth };
    }));
  }
  for (const line of grid) {
    ctx.globalAlpha = 0.05 + line[0]!.depth * 0.42;
    ctx.beginPath();
    line.forEach((point, c) => (c ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y)));
    ctx.stroke();
  }
  for (let c = 0; c <= cols; c++) {
    for (let r = 1; r < rows; r++) {
      const a = grid[r - 1]![c]!, b = grid[r]![c]!;
      ctx.globalAlpha = 0.04 + b.depth * 0.3;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }
  }`,
  },
  {
    name: "hex-pulse", title: "Hex Pulse", mood: "technical",
    description: "A honeycomb that lights up in rings spreading from the centre.",
    tagline: "Built cell by cell.", use: "Infrastructure, security, platforms",
    body: `
  const size = 18, w = Math.sqrt(3) * size, h = size * 1.5;
  for (let row = -1; row * h < height + size; row++) {
    for (let col = -1; col * w < width + w; col++) {
      const x = col * w + (row % 2 ? w / 2 : 0), y = row * h;
      const pulse = Math.max(0, Math.sin(Math.hypot(x - width * 0.5, y - height * 0.5) * 0.02 - time * 1.6));
      ctx.globalAlpha = 0.07 + pulse * 0.45;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i + Math.PI / 6;
        const px = x + Math.cos(a) * (size - 2), py = y + Math.sin(a) * (size - 2);
        if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py);
      }
      ctx.closePath(); ctx.stroke();
    }
  }`,
  },
  {
    name: "isometric-blocks", title: "Isometric Blocks", mood: "technical",
    description: "An isometric field of tiles lifting and settling in slow waves.",
    tagline: "Stack it up.", use: "Developer tools, data, architecture",
    body: `
  const s = 22, rise = s * 0.58;
  for (let gy = -2; gy < height / rise + 3; gy++) {
    for (let gx = -2; gx < width / (s * 2) + 2; gx++) {
      const x = gx * s * 2 + (gy % 2 ? s : 0), y = gy * rise;
      const lift = (Math.sin(gx * 0.6 + time) + Math.cos(gy * 0.4 - time * 0.7)) * 6;
      ctx.globalAlpha = 0.1 + (lift + 12) / 24 * 0.35;
      ctx.beginPath();
      ctx.moveTo(x, y - lift - rise); ctx.lineTo(x + s, y - lift); ctx.lineTo(x, y - lift + rise); ctx.lineTo(x - s, y - lift);
      ctx.closePath(); ctx.stroke();
    }
  }`,
  },
  {
    name: "moire-rings", title: "Moire Rings", mood: "calm",
    description: "Two sets of fine circles sliding past each other, making slow interference patterns.",
    tagline: "Look a little closer.", use: "Editorial, art direction, optics",
    body: `
  const offset = Math.sin(time * 0.3) * width * 0.06;
  const reach = Math.hypot(width, height) * 0.6;
  ctx.globalAlpha = 0.22;
  for (const cx of [width * 0.45 + offset, width * 0.55 - offset]) {
    for (let r = 6; r < reach; r += 7) { ctx.beginPath(); ctx.arc(cx, height * 0.5, r, 0, Math.PI * 2); ctx.stroke(); }
  }`,
  },
  {
    name: "spiral-arms", title: "Spiral Arms", mood: "cosmic",
    description: "A three-armed galaxy of points turning slowly around its core.",
    tagline: "Think bigger.", use: "Space, science, ambitious launches",
    body: `
  const cx = width * 0.5, cy = height * 0.5, reach = Math.hypot(width, height) * 0.5;
  for (let i = 0; i < 760; i++) {
    const t = i / 760;
    const a = t * 9 + (i % 3) * ((Math.PI * 2) / 3) - time * 0.25 + Math.sin(i * 12.9898) * 0.35;
    ctx.globalAlpha = (1 - t) * 0.55 + 0.05;
    ctx.fillRect(cx + Math.cos(a) * t * reach * 0.95, cy + Math.sin(a) * t * reach * 0.6, 1.5, 1.5);
  }`,
  },
  {
    name: "glyph-rain", title: "Glyph Rain", mood: "technical",
    description: "Columns of code characters falling at their own pace, bright at the head.",
    tagline: "Ship it.", use: "Developer tools, APIs, security",
    body: `
  const size = 14, cols = Math.ceil(width / size), rows = height / size;
  const chars = "01<>/{}[]=+*";
  ctx.font = (size - 2) + "px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.textBaseline = "top";
  for (let c = 0; c < cols; c++) {
    const speed = 4 + ((c * 7) % 5), length = 8 + ((c * 13) % 10);
    const head = Math.floor((time * speed + c * 3.7) % (rows + length));
    for (let k = 0; k < length; k++) {
      const row = head - k;
      if (row < 0 || row > rows) continue;
      ctx.globalAlpha = k === 0 ? 0.9 : (1 - k / length) * 0.35;
      ctx.fillText(chars.charAt((c * 31 + row * 17 + Math.floor(time * 3)) % chars.length), c * size, row * size);
    }
  }`,
  },
  {
    name: "radar-sweep", title: "Radar Sweep", mood: "data",
    description: "A radar scope with a sweeping beam that lights up targets as it passes.",
    tagline: "Nothing gets missed.", use: "Monitoring, security, logistics",
    body: `
  const cx = width * 0.5, cy = height * 0.5, R = Math.min(width, height) * 0.46;
  ctx.globalAlpha = 0.18;
  for (let k = 1; k <= 4; k++) { ctx.beginPath(); ctx.arc(cx, cy, (R * k) / 4, 0, Math.PI * 2); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(cx - R, cy); ctx.lineTo(cx + R, cy); ctx.moveTo(cx, cy - R); ctx.lineTo(cx, cy + R); ctx.stroke();
  const angle = (time * 1.1) % (Math.PI * 2);
  for (let k = 0; k < 40; k++) {
    const b = angle - k * 0.02;
    ctx.globalAlpha = (1 - k / 40) * 0.35;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(b) * R, cy + Math.sin(b) * R); ctx.stroke();
  }
  for (const [bx, by] of [[0.3, 0.62], [0.71, 0.28], [0.55, 0.8], [0.18, 0.35], [0.85, 0.55]] as const) {
    const x = cx + (bx - 0.5) * 1.6 * R, y = cy + (by - 0.5) * 1.6 * R;
    let since = (angle - Math.atan2(y - cy, x - cx)) % (Math.PI * 2);
    if (since < 0) since += Math.PI * 2;
    ctx.globalAlpha = Math.max(0, 1 - since / 2.5) * 0.9;
    ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();
  }`,
  },
  {
    name: "film-grain", title: "Film Grain", mood: "organic",
    description: "A living photographic grain that makes a flat surface feel printed.",
    tagline: "Texture, not noise.", use: "Editorial, fashion, film",
    body: `
  let seed = Math.floor(time * 24) * 9301 + 49297;
  const random = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  const count = Math.round((width * height) / 110);
  for (let i = 0; i < count; i++) { ctx.globalAlpha = 0.08 + random() * 0.42; ctx.fillRect(random() * width, random() * height, 1.2, 1.2); }`,
  },
  {
    name: "halftone-wave", title: "Halftone Wave", mood: "organic",
    description: "Print-style halftone dots swelling and shrinking with a slow crossing wave.",
    tagline: "Printed in motion.", use: "Brands, print studios, retro products",
    body: `
  const step = 16;
  for (let row = 0, y = step / 2; y < height + step; row++, y += step * 0.87) {
    for (let x = (row % 2) * (step / 2); x < width + step; x += step) {
      const v = (Math.sin(x * 0.012 + y * 0.008 - time * 0.9) + Math.sin(x * 0.004 - y * 0.011 + time * 0.5) + 2) / 4;
      ctx.globalAlpha = 0.5;
      ctx.beginPath(); ctx.arc(x, y, 0.4 + v * v * step * 0.46, 0, Math.PI * 2); ctx.fill();
    }
  }`,
  },
  {
    name: "starfield-drift", title: "Starfield Drift", mood: "cosmic",
    description: "Three layers of stars drifting past at different depths, twinkling as they go.",
    tagline: "Room to wonder.", use: "Space, night modes, dreamy heroes",
    body: `
  const layers = [[90, 6, 1.2, 0.5], [55, 14, 1.7, 0.7], [26, 30, 2.4, 0.95]] as const;
  layers.forEach(([count, speed, size, strength], layer) => {
    for (let i = 0; i < count; i++) {
      const hx = (Math.sin(i * 12.9898 + layer * 7.1) * 43758.5453) % 1, hy = (Math.sin(i * 78.233 + layer * 3.7) * 12543.891) % 1;
      const x = ((Math.abs(hx) * (width + 20) + time * speed) % (width + 20)) - 10;
      ctx.globalAlpha = strength * (0.35 + 0.65 * (Math.sin(time * 2 + i * 1.7) + 1) / 2);
      ctx.fillRect(x, Math.abs(hy) * height, size, size);
    }
  });`,
  },
  {
    name: "ribbon-flow", title: "Ribbon Flow", mood: "organic",
    description: "Silk ribbons of fine threads sweeping across the surface, twisting as they turn.",
    tagline: "Effortless, on purpose.", use: "Beauty, lifestyle, premium brands",
    body: `
  for (let k = 0; k < 4; k++) {
    for (let i = 0; i < 14; i++) {
      ctx.globalAlpha = 0.07 + (1 - Math.abs(i - 7) / 7) * 0.2;
      ctx.beginPath();
      for (let x = -10; x <= width + 10; x += 8) {
        const u = x / width;
        const center = height * (0.2 + k * 0.2) + Math.sin(u * 3 + time * 0.4 + k) * height * 0.12;
        const twist = 1 + Math.sin(u * 4 + time + k) * 0.8;
        const y = center + (i - 7) * 3 * twist;
        if (x === -10) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }`,
  },
  {
    name: "circuit-trace", title: "Circuit Trace", mood: "technical",
    description: "Board traces with right-angle turns and signals racing along them to their pads.",
    tagline: "Everything, wired.", use: "Hardware, IoT, developer platforms",
    helpers: `
function seeded(seed: number): () => number {
  return () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
}
const random = seeded(11);
/** Fourteen traces in grid units: a start point and five turns each. */
const TRACES = Array.from({ length: 14 }, () => {
  let x = Math.floor(random() * 40), y = Math.floor(random() * 24);
  const points: [number, number][] = [[x, y]];
  let horizontal = random() > 0.5;
  for (let s = 0; s < 5; s++) {
    const step = Math.floor(random() * 6) + 2;
    if (horizontal) x += random() > 0.5 ? step : -step; else y += random() > 0.5 ? step : -step;
    points.push([x, y]);
    horizontal = !horizontal;
  }
  return points;
});`,
    body: `
  const cell = 24;
  for (const [index, trace] of TRACES.entries()) {
    const points = trace.map(([gx, gy]) => [gx * cell, gy * cell] as const);
    ctx.globalAlpha = 0.2;
    ctx.beginPath();
    points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.stroke();
    for (const [x, y] of [points[0]!, points[points.length - 1]!]) { ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.stroke(); }
    const lengths = points.slice(1).map(([x, y], i) => Math.abs(x - points[i]![0]) + Math.abs(y - points[i]![1]));
    const total = lengths.reduce((a, b) => a + b, 0);
    let along = ((time * 90 + index * 57) % (total + 160)) - 40;
    for (let i = 0; i < lengths.length && along >= 0; i++) {
      if (along <= lengths[i]!) {
        const [x0, y0] = points[i]!, [x1, y1] = points[i + 1]!, f = along / lengths[i]!;
        ctx.globalAlpha = 0.95;
        ctx.beginPath(); ctx.arc(x0 + (x1 - x0) * f, y0 + (y1 - y0) * f, 2.2, 0, Math.PI * 2); ctx.fill();
        break;
      }
      along -= lengths[i]!;
    }
  }`,
  },
  {
    name: "double-helix", title: "Double Helix", mood: "organic",
    description: "Two strands winding around each other with rungs between them, turning in depth.",
    tagline: "In the details.", use: "Biotech, health, research",
    body: `
  const mid = height * 0.5, amp = height * 0.22;
  for (let x = 0; x < width; x += 24) {
    const a = x * 0.018 + time;
    ctx.globalAlpha = 0.15;
    ctx.beginPath(); ctx.moveTo(x, mid + Math.sin(a) * amp); ctx.lineTo(x, mid + Math.sin(a + Math.PI) * amp); ctx.stroke();
  }
  for (const strand of [0, Math.PI]) {
    for (let x = 0; x < width; x += 6) {
      const a = x * 0.018 + time + strand;
      const depth = (Math.cos(a) + 1) / 2;
      ctx.globalAlpha = 0.2 + depth * 0.7;
      ctx.beginPath(); ctx.arc(x, mid + Math.sin(a) * amp, 0.8 + depth * 1.8, 0, Math.PI * 2); ctx.fill();
    }
  }`,
  },
  {
    name: "ridge-lines", title: "Ridge Lines", mood: "data",
    description: "Stacked signal lines that hide one another, like a pulsar plot drawn live.",
    tagline: "Signal, not noise.", use: "Music, data, research",
    body: `
  const lines = 24, top = height * 0.16, gap = (height * 0.72) / lines;
  for (let l = 0; l < lines; l++) {
    const base = top + l * gap;
    const points: [number, number][] = [];
    for (let x = 0; x <= width; x += 5) {
      const u = x / width;
      const envelope = Math.exp(-((u - 0.5) ** 2) / 0.018);
      const noise = Math.sin(u * 40 + l * 1.7 + time * 1.2) * 0.5 + Math.sin(u * 17 - l * 0.9 + time * 0.7) * 0.5;
      points.push([x, base - envelope * (18 + noise * 22) * (0.6 + Math.sin(l * 0.7 + time * 0.3) * 0.4)]);
    }
    ctx.globalCompositeOperation = "destination-out";
    ctx.globalAlpha = 1;
    ctx.beginPath();
    points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.lineTo(width, height); ctx.lineTo(0, height); ctx.closePath(); ctx.fill();
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 0.75;
    ctx.beginPath();
    points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.stroke();
  }`,
  },
  {
    name: "plus-grid", title: "Plus Grid", mood: "technical",
    description: "A grid of crosses that turn and swell in waves, like a blueprint breathing.",
    tagline: "Precision, at rest.", use: "Architecture, engineering, studios",
    body: `
  const step = 28;
  for (let y = step / 2; y < height; y += step) {
    for (let x = step / 2; x < width; x += step) {
      const wave = Math.sin(x * 0.015 - time * 1.1) * Math.cos(y * 0.02 + time * 0.6);
      const size = 3 + (wave + 1) * 2;
      ctx.save(); ctx.translate(x, y); ctx.rotate(wave * Math.PI * 0.25);
      ctx.globalAlpha = 0.15 + (wave + 1) * 0.2;
      ctx.beginPath(); ctx.moveTo(-size, 0); ctx.lineTo(size, 0); ctx.moveTo(0, -size); ctx.lineTo(0, size); ctx.stroke();
      ctx.restore();
    }
  }`,
  },
  {
    name: "diagonal-scan", title: "Diagonal Scan", mood: "technical",
    description: "Fine diagonal stripes with a bright band sweeping across them.",
    tagline: "Scanning for better.", use: "Security, AI, analysis",
    body: `
  const spacing = 12, span = width + height;
  const band = ((time * 0.18) % 1.4) - 0.2;
  for (let d = -height; d < width; d += spacing) {
    const position = (d + height) / span;
    ctx.globalAlpha = 0.07 + Math.exp(-((position - band) ** 2) / 0.004) * 0.6;
    ctx.beginPath(); ctx.moveTo(d, height); ctx.lineTo(d + height, 0); ctx.stroke();
  }`,
  },
  {
    name: "rising-bubbles", title: "Rising Bubbles", mood: "calm",
    description: "Bubbles drifting upward and swaying, fading as they reach the surface.",
    tagline: "Light as air.", use: "Drinks, wellness, playful brands",
    body: `
  for (let i = 0; i < 44; i++) {
    const h1 = Math.abs(Math.sin(i * 12.9898) * 43758.5453) % 1, h2 = Math.abs(Math.sin(i * 78.233) * 12543.891) % 1;
    const speed = 18 + h2 * 30, radius = 3 + h1 * 9;
    const y = height + 30 - ((time * speed + h2 * height * 1.3) % (height + 60));
    const x = h1 * width + Math.sin(time + i) * 12;
    ctx.globalAlpha = Math.min(1, y / (height * 0.5)) * 0.4;
    ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.stroke();
  }`,
  },
  {
    name: "fireflies", title: "Fireflies", mood: "calm",
    description: "Soft points of light wandering in loose loops and blinking on and off.",
    tagline: "A little magic.", use: "Evening modes, hospitality, storytelling",
    body: `
  for (let i = 0; i < 34; i++) {
    const h = Math.abs(Math.sin(i * 91.7) * 1000) % 1;
    const x = width * (0.5 + 0.42 * Math.sin(time * (0.1 + h * 0.12) + i * 2.3));
    const y = height * (0.5 + 0.4 * Math.sin(time * (0.13 + h * 0.1) + i * 1.1) * Math.cos(time * 0.07 + i));
    const glow = Math.max(0, Math.sin(time * (1 + h) + i * 3));
    for (const [r, a] of [[10, 0.06], [5, 0.15], [1.8, 0.9]] as const) {
      ctx.globalAlpha = a * glow;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
  }`,
  },
  {
    name: "depth-tunnel", title: "Depth Tunnel", mood: "cosmic",
    description: "Rounded frames rushing toward you out of a vanishing point, twisting as they come.",
    tagline: "Go deeper.", use: "Gaming, events, immersive launches",
    body: `
  const cx = width * 0.5, cy = height * 0.5, reach = Math.hypot(width, height) * 0.62;
  for (let k = 0; k < 18; k++) {
    const z = (k / 18 + time * 0.12) % 1;
    const size = z ** 2.2 * reach;
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(z * 0.6 + time * 0.05);
    ctx.globalAlpha = z * 0.6;
    ctx.beginPath(); ctx.roundRect(-size, -size * 0.62, size * 2, size * 1.24, size * 0.08); ctx.stroke();
    ctx.restore();
  }`,
  },
  {
    name: "lissajous", title: "Lissajous", mood: "cosmic",
    description: "Four harmonic curves slowly changing phase, like an oscilloscope drawing music.",
    tagline: "In harmony.", use: "Audio, science, mathematics",
    body: `
  const curves = [[3, 2], [5, 4], [3, 4], [5, 6]] as const;
  curves.forEach(([a, b], index) => {
    const scale = 0.18 + index * 0.07;
    ctx.globalAlpha = 0.18 + index * 0.08;
    ctx.beginPath();
    for (let i = 0; i <= 320; i++) {
      const t = (i / 320) * Math.PI * 2;
      const x = width * 0.5 + Math.sin(a * t + time * 0.3 + index) * width * scale;
      const y = height * 0.5 + Math.sin(b * t) * height * scale * 1.2;
      if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
    }
    ctx.stroke();
  });`,
  },
  {
    name: "sunflower", title: "Sunflower", mood: "calm",
    description: "A golden-angle spiral of points turning slowly, a wave of growth running out from the centre.",
    tagline: "Grown, not made.", use: "Nature, food, sustainability",
    body: `
  const count = 540, c = Math.min(width, height) / (2.1 * Math.sqrt(count));
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const r = c * Math.sqrt(i), a = i * golden + time * 0.1;
    const swell = (Math.sin(Math.sqrt(i) * 0.9 - time * 2) + 1) / 2;
    ctx.globalAlpha = 0.25 + swell * 0.55;
    ctx.beginPath(); ctx.arc(width * 0.5 + Math.cos(a) * r, height * 0.5 + Math.sin(a) * r, 0.8 + swell * 1.6, 0, Math.PI * 2); ctx.fill();
  }`,
  },
  {
    name: "ascii-field", title: "ASCII Field", mood: "technical",
    description: "A field of characters whose density follows a drifting pattern, like a terminal dreaming.",
    tagline: "Text, all the way down.", use: "Developer tools, retro, terminals",
    body: `
  const cw = 16, ch = 22, ramp = " .:-=+*#%@";
  ctx.font = "13px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.textBaseline = "top";
  ctx.globalAlpha = 0.5;
  for (let y = 0; y < height; y += ch) {
    for (let x = 0; x < width; x += cw) {
      const v = (Math.sin(x * 0.011 + time * 0.7) + Math.sin(y * 0.017 - time * 0.5) + Math.sin((x + y) * 0.007 + time * 0.3) + 3) / 6;
      const glyph = ramp[Math.min(ramp.length - 1, Math.floor(v * ramp.length))]!;
      if (glyph !== " ") ctx.fillText(glyph, x, y);
    }
  }`,
  },
  {
    name: "ping-grid", title: "Ping Grid", mood: "data",
    description: "A quiet dot grid where signals ping at random points and ripple outward.",
    tagline: "Heard everywhere.", use: "Networks, notifications, maps",
    body: `
  const step = 20;
  const pings = Array.from({ length: 6 }, (_, i) => {
    const cycle = 4 + (i % 3);
    const round = Math.floor((time + i * 1.3) / cycle);
    const age = ((time + i * 1.3) % cycle) / cycle;
    const hx = Math.abs(Math.sin(round * 12.9898 + i * 4.1) * 43758.5453) % 1, hy = Math.abs(Math.sin(round * 78.233 + i * 2.7) * 12543.891) % 1;
    return { x: hx * width, y: hy * height, radius: age * 160, strength: 1 - age };
  });
  for (let y = step / 2; y < height; y += step) {
    for (let x = step / 2; x < width; x += step) {
      let light = 0;
      for (const ping of pings) light = Math.max(light, Math.exp(-((Math.hypot(x - ping.x, y - ping.y) - ping.radius) ** 2) / 120) * ping.strength);
      ctx.globalAlpha = 0.12 + light * 0.8;
      ctx.beginPath(); ctx.arc(x, y, 1 + light * 1.8, 0, Math.PI * 2); ctx.fill();
    }
  }`,
  },
  {
    name: "oscilloscope", title: "Oscilloscope", mood: "data",
    description: "A measuring grid with three waveforms tracing through it, one bright, two faint.",
    tagline: "Measured, not guessed.", use: "Hardware, audio, analytics",
    body: `
  ctx.globalAlpha = 0.1;
  ctx.beginPath();
  for (let i = 1; i < 10; i++) { const x = (width * i) / 10; ctx.moveTo(x, 0); ctx.lineTo(x, height); }
  for (let i = 1; i < 6; i++) { const y = (height * i) / 6; ctx.moveTo(0, y); ctx.lineTo(width, y); }
  ctx.stroke();
  ([[0.8, 1.5, 1], [0.45, 1, 1.7], [0.25, 1, 2.6]] as const).forEach(([alpha, line, ratio]) => {
    ctx.globalAlpha = alpha; ctx.lineWidth = line;
    ctx.beginPath();
    for (let x = 0; x <= width; x += 3) {
      const u = x / width;
      const y = height * 0.5 + (Math.sin(u * 12 * ratio + time * 2) * 0.6 + Math.sin(u * 31 - time * 1.3) * 0.2) * height * 0.28;
      if (x) ctx.lineTo(x, y); else ctx.moveTo(x, y);
    }
    ctx.stroke();
  });`,
  },
  {
    name: "live-chart", title: "Live Chart", mood: "data",
    description: "Graph paper with a line chart drawing itself, holding, then starting over.",
    tagline: "Watch it grow.", use: "Dashboards, finance, growth stories",
    helpers: `
/** A fixed random walk, so the chart tells the same good story every time. */
const VALUES = (() => {
  let seed = 7, value = 0.35;
  return Array.from({ length: 60 }, () => {
    seed = (seed * 16807) % 2147483647;
    value = Math.min(0.92, Math.max(0.08, value + (seed / 2147483647 - 0.42) * 0.09));
    return value;
  });
})();`,
    body: `
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; x < width; x += 12) { ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, height); }
  for (let y = 0; y < height; y += 12) { ctx.moveTo(0, y + 0.5); ctx.lineTo(width, y + 0.5); }
  ctx.globalAlpha = 0.06; ctx.stroke();
  ctx.beginPath();
  for (let x = 0; x < width; x += 60) { ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, height); }
  for (let y = 0; y < height; y += 60) { ctx.moveTo(0, y + 0.5); ctx.lineTo(width, y + 0.5); }
  ctx.globalAlpha = 0.12; ctx.stroke();
  const cycle = (time * 0.16) % 1.3;
  const shown = Math.min(1, cycle) * (VALUES.length - 1);
  const fade = cycle > 1.15 ? 1 - (cycle - 1.15) / 0.15 : 1;
  ctx.globalAlpha = 0.9 * fade; ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i <= shown; i++) {
    const x = width * 0.06 + (i / (VALUES.length - 1)) * width * 0.88, y = height * (1 - VALUES[i]!) ;
    if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
  }
  ctx.stroke();`,
  },
  {
    name: "polygon-bloom", title: "Polygon Bloom", mood: "cosmic",
    description: "Nested polygons from triangle to octagon, each turning its own way.",
    tagline: "Every angle covered.", use: "Crypto, design tools, geometry",
    body: `
  const cx = width * 0.5, cy = height * 0.5, reach = Math.min(width, height) * 0.46;
  for (let k = 0; k < 12; k++) {
    const sides = 3 + (k % 6), radius = reach * ((k + 1) / 12);
    const spin = time * 0.15 * (k % 2 ? 1 : -1) * (1 + k * 0.08);
    ctx.globalAlpha = 0.12 + (k / 12) * 0.3;
    ctx.beginPath();
    for (let i = 0; i <= sides; i++) {
      const a = spin + (i / sides) * Math.PI * 2;
      const x = cx + Math.cos(a) * radius, y = cy + Math.sin(a) * radius;
      if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
    }
    ctx.stroke();
  }`,
  },
  {
    name: "sketch-lines", title: "Sketch Lines", mood: "organic",
    description: "Loose curves drawing themselves across the surface and fading, like a pen thinking.",
    tagline: "Ideas, in progress.", use: "Design studios, creative tools, education",
    body: `
  for (let k = 0; k < 6; k++) {
    const cycle = 7 + k, local = ((time + k * 1.9) % cycle) / cycle;
    const draw = Math.min(1, local / 0.6), fade = local > 0.75 ? 1 - (local - 0.75) / 0.25 : 1;
    const y0 = height * (0.15 + k * 0.14);
    ctx.globalAlpha = 0.45 * fade;
    ctx.beginPath();
    const steps = Math.floor(80 * draw);
    for (let i = 0; i <= steps; i++) {
      const u = i / 80;
      const x = width * (0.05 + u * 0.9), y = y0 + Math.sin(u * 6 + k * 2.1) * height * 0.06 + Math.sin(u * 17 + k) * 6;
      if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
    }
    ctx.stroke();
  }`,
  },
  {
    name: "rain-streaks", title: "Rain Streaks", mood: "calm",
    description: "Slanted rain falling at different depths, light and steady.",
    tagline: "Stay in.", use: "Weather, cafes, cosy evening pages",
    body: `
  for (let i = 0; i < 130; i++) {
    const h1 = Math.abs(Math.sin(i * 12.9898) * 43758.5453) % 1, h2 = Math.abs(Math.sin(i * 78.233) * 12543.891) % 1;
    const speed = 220 + h2 * 260, length = 10 + h2 * 22;
    const y = ((time * speed + h1 * height * 3) % (height + 60)) - 30;
    const x = ((h1 * (width + 100) - y * 0.2) % (width + 100) + width + 100) % (width + 100) - 50;
    ctx.globalAlpha = 0.12 + h2 * 0.25;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - length * 0.2, y + length); ctx.stroke();
  }`,
  },
  {
    name: "light-curtain", title: "Light Curtain", mood: "organic",
    description: "Hanging threads of light swaying like an aurora curtain.",
    tagline: "Let it glow.", use: "Night modes, music, luxury",
    body: `
  for (let x = 0; x < width; x += 6) {
    const u = x / width;
    const top = height * (0.12 + 0.08 * Math.sin(u * 5 + time * 0.4));
    const length = height * (0.3 + 0.28 * (Math.sin(u * 9 - time * 0.6) + 1) / 2);
    const strength = (Math.sin(u * 14 + time) + 1) / 2;
    for (let s = 0; s < 3; s++) {
      ctx.globalAlpha = (0.08 + strength * 0.3) * (1 - s / 3);
      ctx.beginPath(); ctx.moveTo(x, top + (length * s) / 3); ctx.lineTo(x, top + (length * (s + 1)) / 3); ctx.stroke();
    }
  }`,
  },
];
