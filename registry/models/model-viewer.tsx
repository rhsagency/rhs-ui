"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type ModelPart = {
  shape: "box" | "sphere" | "torus" | "knot" | "capsule" | "cylinder" | "octahedron";
  position?: readonly [number, number, number];
  rotation?: readonly [number, number, number];
  scale?: readonly [number, number, number];
  color?: string;
  metalness?: number;
  roughness?: number;
  /** Tube radius for a torus, relative to its unit ring radius. */
  tube?: number;
};
export type ModelAsset = { url: string; position?: readonly [number, number, number]; rotation?: readonly [number, number, number]; scale?: readonly [number, number, number] };
export type ModelRecipe = { name: string; parts: readonly ModelPart[]; assets?: readonly ModelAsset[] };
export interface ModelViewerProps { model: ModelRecipe; poster?: string; className?: string; active?: boolean }

/** Loads WebGL on request. Frames are rendered only after input or resize. */
export function ModelViewer({ model, poster, className, active = false }: ModelViewerProps): React.JSX.Element {
  const [enabled, setEnabled] = useState(active);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const [exporting, setExporting] = useState(false);
  const host = useRef<HTMLDivElement>(null);
  const controls = useRef<{ turn: (amount: number) => void; reset: () => void; download: () => Promise<void> } | null>(null);
  useEffect(() => {
    if (!enabled || !host.current) return;
    const container = host.current;
    let disposed = false;
    let cleanup = (): void => {};
    void (async (): Promise<void> => {
      const [T, { RoundedBoxGeometry }, { RoomEnvironment }] = await Promise.all([import("three"), import("three/addons/geometries/RoundedBoxGeometry.js"), import("three/addons/environments/RoomEnvironment.js")]);
      if (disposed) return;
      const renderer = new T.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
      renderer.setClearColor(0x000000, 0);
      renderer.toneMapping = T.ACESFilmicToneMapping;
      const scene = new T.Scene();
      const pmrem = new T.PMREMGenerator(renderer);
      const room = new RoomEnvironment();
      const environment = pmrem.fromScene(room, 0.04);
      scene.environment = environment.texture;
      room.dispose();
      pmrem.dispose();
      const group = new T.Group();
      const geometries: import("three").BufferGeometry[] = [];
      const materials: import("three").Material[] = [];
      cleanup = () => {
        geometries.forEach((geometry) => geometry.dispose());
        materials.forEach((material) => material.dispose());
        environment.dispose(); renderer.dispose();
      };
      for (const part of model.parts) {
        const geometry = part.shape === "box" ? new RoundedBoxGeometry(1.7, 1.7, 1.7, 5, 0.2)
          : part.shape === "sphere" ? new T.SphereGeometry(1, 48, 32)
          : part.shape === "torus" ? new T.TorusGeometry(1, Number.isFinite(part.tube) ? Math.max(.01, Math.min(.5, part.tube!)) : .24, 24, 80)
          : part.shape === "knot" ? new T.TorusKnotGeometry(0.85, 0.24, 128, 20)
          : part.shape === "capsule" ? new T.CapsuleGeometry(0.6, 1, 12, 32)
          : part.shape === "octahedron" ? new T.OctahedronGeometry(1, 0)
          : new T.CylinderGeometry(1, 1, 0.45, 64);
        const material = new T.MeshStandardMaterial({ color: part.color ?? "#b7b7b7", metalness: part.metalness ?? 0.85, roughness: part.roughness ?? 0.22 });
        geometries.push(geometry); materials.push(material);
        const mesh = new T.Mesh(geometry, material);
        if (part.position) mesh.position.set(...part.position);
        if (part.rotation) mesh.rotation.set(...part.rotation);
        if (part.scale) mesh.scale.set(...part.scale);
        group.add(mesh);
      }
      if (model.assets?.length) {
        const { GLTFLoader } = await import("three/addons/loaders/GLTFLoader.js");
        const loader = new GLTFLoader();
        const cache = new Map<string, Promise<import("three/addons/loaders/GLTFLoader.js").GLTF>>();
        for (const asset of model.assets) {
          let pending = cache.get(asset.url);
          if (!pending) { pending = loader.loadAsync(asset.url); cache.set(asset.url, pending); }
          const loaded = await pending;
          const node = loaded.scene.clone(true);
          node.traverse((object) => {
            if (!(object instanceof T.Mesh)) return;
            geometries.push(object.geometry);
            for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
              if (material instanceof T.MeshPhysicalMaterial) material.clearcoat = 0;
              materials.push(material);
            }
          });
          if (asset.position) node.position.set(...asset.position);
          if (asset.rotation) node.rotation.set(...asset.rotation);
          if (asset.scale) node.scale.set(...asset.scale);
          group.add(node);
        }
        if (disposed) { geometries.forEach((geometry) => geometry.dispose()); materials.forEach((material) => material.dispose()); environment.dispose(); renderer.dispose(); return; }
      }
      const bounds = new T.Box3().setFromObject(group);
      const center = bounds.getCenter(new T.Vector3());
      group.position.sub(center);
      const pivot = new T.Group();
      pivot.add(group); scene.add(pivot);
      const extent = bounds.getSize(new T.Vector3()).length();
      const camera = new T.PerspectiveCamera(35, 1, 0.1, 100);
      camera.position.set(0, extent * 0.12, extent * 1.55);
      camera.lookAt(0, 0, 0);
      pivot.rotation.set(0.12, -0.35, 0);
      container.appendChild(renderer.domElement);
      renderer.domElement.setAttribute("aria-hidden", "true");
      renderer.domElement.className = "absolute inset-0 size-full";
      const render = (): void => { if (!disposed && !document.hidden) renderer.render(scene, camera); };
      const resize = new ResizeObserver(() => {
        const { width, height } = container.getBoundingClientRect();
        if (!width || !height) return;
        renderer.setSize(width, height, false); camera.aspect = width / height; camera.updateProjectionMatrix(); render();
      });
      resize.observe(container);
      const turn = (amount: number): void => { pivot.rotation.y += amount; render(); };
      let drag: { x: number; y: number; id: number } | null = null;
      const down = (event: PointerEvent): void => { if (event.pointerType !== "mouse") return; drag = { x: event.clientX, y: event.clientY, id: event.pointerId }; container.setPointerCapture(event.pointerId); };
      const move = (event: PointerEvent): void => {
        if (!drag) return;
        pivot.rotation.y += (event.clientX - drag.x) * 0.008;
        pivot.rotation.x = Math.max(-0.6, Math.min(0.6, pivot.rotation.x + (event.clientY - drag.y) * 0.005));
        drag = { ...drag, x: event.clientX, y: event.clientY }; render();
      };
      const up = (): void => { drag = null; };
      container.addEventListener("pointerdown", down); container.addEventListener("pointermove", move); container.addEventListener("pointerup", up); container.addEventListener("lostpointercapture", up);
      document.addEventListener("visibilitychange", render);
      controls.current = { turn, reset: () => { pivot.rotation.set(0.12, -0.35, 0); render(); }, download: async () => {
        const { GLTFExporter } = await import("three/addons/exporters/GLTFExporter.js");
        const data = await new GLTFExporter().parseAsync(group, { binary: true });
        if (!(data instanceof ArrayBuffer)) throw new Error("Expected binary GLB");
        const url = URL.createObjectURL(new Blob([data], { type: "model/gltf-binary" }));
        const link = document.createElement("a"); link.href = url; link.download = `${model.name}.glb`; link.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      } };
      const contextLost = (event: Event): void => { event.preventDefault(); setError(true); setReady(false); };
      renderer.domElement.addEventListener("webglcontextlost", contextLost);
      cleanup = () => {
        controls.current = null; resize.disconnect();
        container.removeEventListener("pointerdown", down); container.removeEventListener("pointermove", move); container.removeEventListener("pointerup", up); container.removeEventListener("lostpointercapture", up);
        document.removeEventListener("visibilitychange", render);
        renderer.domElement.removeEventListener("webglcontextlost", contextLost);
        geometries.forEach((geometry) => geometry.dispose()); materials.forEach((material) => material.dispose());
        environment.dispose(); renderer.dispose(); renderer.domElement.remove();
      };
      setReady(true);
    })().catch(() => { cleanup(); if (!disposed) setError(true); });
    return () => { disposed = true; cleanup(); };
  }, [enabled, model]);
  const button = "rounded-full border border-border px-3 py-2 text-xs transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-40";
  return <div data-slot="model-viewer" data-ready={ready} className={cn("w-full", className)}>
    <div ref={host} role="group" aria-label={`${model.name}, interactive 3D model`} className="relative aspect-square w-full overflow-hidden rounded-xl bg-muted">
      {poster && !ready && <img src={poster} alt="" className="absolute inset-0 size-full object-cover" />}
      {!enabled && <button type="button" onClick={() => setEnabled(true)} className="absolute bottom-5 left-1/2 z-10 -translate-x-1/2 rounded-full bg-foreground px-5 py-3 text-xs text-background">Explore in 3D</button>}
      {enabled && !ready && <p role="status" className="absolute inset-x-0 bottom-5 text-center text-xs">{error ? "3D is unavailable in this browser. The preview is still available." : "Loading 3D…"}</p>}
    </div>
    {ready && <div className="mt-3 flex flex-wrap items-center justify-center gap-2"><button type="button" className={button} onClick={() => controls.current?.turn(-0.35)} aria-label="Rotate left">←</button><button type="button" className={button} onClick={() => controls.current?.turn(0.35)} aria-label="Rotate right">→</button><button type="button" className={button} onClick={() => controls.current?.reset()}>Reset</button><button type="button" className={button} disabled={exporting} onClick={async () => { setExporting(true); try { await controls.current?.download(); } catch { setError(true); } finally { setExporting(false); } }}>{exporting ? "Exporting…" : "Download GLB"}</button></div>}
    {ready && error && <p role="alert" className="mt-2 text-center text-xs">Export failed. Please try again.</p>}
  </div>;
}
