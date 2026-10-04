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
];
