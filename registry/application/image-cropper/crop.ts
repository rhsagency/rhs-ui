/** A rectangle on the source image, in the image's own pixels. */
export interface CropRect {
  /** Pixels from the left edge of the image. */
  x: number;
  /** Pixels from the top edge of the image. */
  y: number;
  width: number;
  height: number;
}

/** The crop and how far it is zoomed in: 1 is the largest crop of its shape, 2 is half as wide. */
export interface ImageCrop extends CropRect {
  zoom: number;
}

/** A frame on the stage, in pixels from its top left corner. */
export interface Frame {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** How the stage shows a crop: where the frame is, and how the image lies under it. */
export interface Layout {
  frame: Frame;
  /** Stage pixels per image pixel. */
  scale: number;
  /** Where the image's top left corner is on the stage. */
  offsetX: number;
  offsetY: number;
}

export type Handle = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

const between = (n: number, low: number, high: number): number => Math.min(high, Math.max(low, n));

/** The largest rectangle of a shape (width divided by height) that fits inside a box. */
export function fitInside(boxWidth: number, boxHeight: number, aspect: number): { width: number; height: number } {
  const width = Math.max(1, Math.min(boxWidth, boxHeight * aspect));
  return { width, height: width / aspect };
}

/** The shape of a rectangle: width divided by height. */
export const aspectOf = (rect: CropRect): number => rect.width / rect.height;

/** Keeps a rectangle on the image, and at least a pixel big. */
export function keepInside(rect: CropRect, imageWidth: number, imageHeight: number): CropRect {
  const width = between(rect.width, 1, imageWidth);
  const height = between(rect.height, 1, imageHeight);
  return { x: between(rect.x, 0, imageWidth - width), y: between(rect.y, 0, imageHeight - height), width, height };
}

/** The largest crop of a shape that fits on the image. */
export function largestCrop(imageWidth: number, imageHeight: number, aspect: number): { width: number; height: number } {
  const width = Math.min(imageWidth, imageHeight * aspect);
  return { width, height: width / aspect };
}

/** How far a crop is zoomed in, counted from the largest crop of its own shape. */
export function zoomOf(rect: CropRect, imageWidth: number, imageHeight: number): number {
  return largestCrop(imageWidth, imageHeight, aspectOf(rect)).width / rect.width;
}

/** The crop to start with: the largest of the shape, in the middle. Without a shape (free) it is the whole image. */
export function centredCrop(imageWidth: number, imageHeight: number, aspect: number | null): CropRect {
  if (aspect === null) return { x: 0, y: 0, width: imageWidth, height: imageHeight };
  const { width, height } = largestCrop(imageWidth, imageHeight, aspect);
  return { x: (imageWidth - width) / 2, y: (imageHeight - height) / 2, width, height };
}

/**
 * Zooms a crop to `zoom`, keeping its shape and the point of the image under
 * `focus` where it is: (0.5, 0.5) is the middle of the crop, (0, 0) its top left corner.
 */
export function zoomCrop(rect: CropRect, imageWidth: number, imageHeight: number, zoom: number, focus: { x: number; y: number } = { x: 0.5, y: 0.5 }): CropRect {
  const aspect = aspectOf(rect);
  const width = largestCrop(imageWidth, imageHeight, aspect).width / zoom;
  const height = width / aspect;
  const pointX = rect.x + focus.x * rect.width;
  const pointY = rect.y + focus.y * rect.height;
  return keepInside({ x: pointX - focus.x * width, y: pointY - focus.y * height, width, height }, imageWidth, imageHeight);
}

/**
 * Makes whatever was given (a saved crop, one from before the shape changed,
 * nothing at all) a crop that fits the image, the shape and the zoom limits.
 * A crop of the right shape is left as it is; one of another shape keeps its
 * middle and its zoom.
 */
export function settleCrop(raw: CropRect | null, imageWidth: number, imageHeight: number, aspect: number | null, minZoom: number, maxZoom: number): CropRect {
  if (!raw || !(raw.width > 0) || !(raw.height > 0)) return centredCrop(imageWidth, imageHeight, aspect);
  let rect = keepInside(raw, imageWidth, imageHeight);
  if (aspect !== null && Math.abs(aspectOf(rect) / aspect - 1) > 0.005) {
    const zoom = between(zoomOf(rect, imageWidth, imageHeight), minZoom, maxZoom);
    const width = largestCrop(imageWidth, imageHeight, aspect).width / zoom;
    return keepInside({ x: rect.x + rect.width / 2 - width / 2, y: rect.y + rect.height / 2 - width / aspect / 2, width, height: width / aspect }, imageWidth, imageHeight);
  }
  // A crop with no fixed shape is sized by its handles, so the zoom limits only apply to a shape that is kept.
  if (aspect === null) return rect;
  const zoom = zoomOf(rect, imageWidth, imageHeight);
  if (zoom < minZoom - 0.001 || zoom > maxZoom + 0.001) rect = zoomCrop(rect, imageWidth, imageHeight, between(zoom, minZoom, maxZoom));
  return rect;
}

/**
 * Lays a crop out on a stage: the frame is the largest rectangle of the crop's
 * shape that fits with a margin, in the middle, and the image is scaled and
 * moved under it so that exactly the crop shows inside the frame.
 */
export function layoutOf(rect: CropRect, stageWidth: number, stageHeight: number): Layout {
  const margin = Math.max(10, Math.min(28, Math.round(Math.min(stageWidth, stageHeight) * 0.07)));
  const fit = fitInside(stageWidth - margin * 2, stageHeight - margin * 2, aspectOf(rect));
  const left = (stageWidth - fit.width) / 2;
  const top = (stageHeight - fit.height) / 2;
  const scale = fit.width / rect.width;
  return { frame: { left, top, width: fit.width, height: fit.height }, scale, offsetX: left - rect.x * scale, offsetY: top - rect.y * scale };
}

/** Rounds the numbers a crop reports, so they carry no floating-point dust. */
export function toCrop(rect: CropRect, imageWidth: number, imageHeight: number): ImageCrop {
  const round = (n: number) => Math.round(n * 100) / 100;
  return { x: round(rect.x), y: round(rect.y), width: round(rect.width), height: round(rect.height), zoom: round(zoomOf(rect, imageWidth, imageHeight)) };
}

/**
 * Moves the edges that a handle holds by the distance it was dragged, keeping
 * the frame inside `limits` and at least `min` pixels big on each side.
 */
export function resizeFrame(start: Frame, handle: Handle, dx: number, dy: number, limits: { left: number; top: number; right: number; bottom: number }, min: number): Frame {
  let left = start.left;
  let top = start.top;
  let right = start.left + start.width;
  let bottom = start.top + start.height;
  if (handle.includes("w")) left = between(left + dx, limits.left, right - min);
  if (handle.includes("e")) right = between(right + dx, left + min, limits.right);
  if (handle.includes("n")) top = between(top + dy, limits.top, bottom - min);
  if (handle.includes("s")) bottom = between(bottom + dy, top + min, limits.bottom);
  return { left, top, width: right - left, height: bottom - top };
}

/**
 * Safari draws an SVG picture at the size it is shown at, not its own, so a
 * crop given in the picture's own pixels would be cut from the wrong place.
 * A fresh copy of the picture, not on the page and so not sized, is drawn at
 * its own size. Any other picture is used as it is.
 */
async function atNaturalSize(image: CanvasImageSource): Promise<CanvasImageSource> {
  if (typeof HTMLImageElement === "undefined" || !(image instanceof HTMLImageElement)) return image;
  const address = image.currentSrc || image.src;
  if (!/^data:image\/svg|\.svg(?:[?#]|$)/i.test(address)) return image;
  try {
    const copy = new Image();
    copy.crossOrigin = image.crossOrigin;
    copy.src = address;
    await copy.decode();
    return copy;
  } catch {
    return image;
  }
}

export interface CropToBlobOptions {
  /** The file type: "image/png" (the default), "image/jpeg" or "image/webp". */
  type?: string;
  /** For JPEG and WebP: 0 to 1. */
  quality?: number;
  /** Scale the result down so it is at most this many pixels wide. The crop is never scaled up. */
  maxWidth?: number;
  /** `round` cuts the picture to a circle with transparent corners: use PNG or WebP. */
  shape?: "rect" | "round";
}

/**
 * Cuts the crop out of the image in the browser and gives it back as a file.
 * The image must be one the page may read: a picture from another site needs
 * `crossOrigin="anonymous"` and a server that allows it, or the browser
 * refuses with a SecurityError. Use it with the `image` that `onReady` gives.
 */
export async function cropToBlob(image: CanvasImageSource & { naturalWidth?: number }, rect: CropRect, options: CropToBlobOptions = {}): Promise<Blob> {
  const { type = "image/png", quality, maxWidth, shape = "rect" } = options;
  const source = await atNaturalSize(image);
  const scale = maxWidth !== undefined && rect.width > maxWidth ? maxWidth / rect.width : 1;
  const width = Math.max(1, Math.round(rect.width * scale));
  const height = Math.max(1, Math.round(rect.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("This browser cannot draw the crop.");
  if (shape === "round") {
    context.beginPath();
    context.ellipse(width / 2, height / 2, width / 2, height / 2, 0, 0, Math.PI * 2);
    context.clip();
  }
  context.imageSmoothingQuality = "high";
  context.drawImage(source, rect.x, rect.y, rect.width, rect.height, 0, 0, width, height);
  return new Promise<Blob>((resolve, reject) => {
    try {
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("The crop could not be saved as that type of file."))), type, quality);
    } catch (error) {
      // A picture from another site taints the canvas and the browser refuses to read it back.
      reject(error instanceof Error ? error : new Error("The browser would not read the crop."));
    }
  });
}
