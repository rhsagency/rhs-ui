/*
 * The pure half of the directions button: a place in, a link for each maps app
 * out, with every part properly encoded. Nothing here touches the page, so the
 * builders can be tested with plain inputs. The button in index.tsx decides
 * which app comes first and what to show.
 */

export type DirectionsApp = "apple" | "google" | "waze";
export type TravelMode = "driving" | "walking" | "cycling" | "transit";

export interface DirectionsPlace {
  /** What the place is called. It goes into the query, so the pin is labelled with it. */
  name?: string;
  /** The street address, as people write it. */
  address?: string;
  /** Exact position, when you have it and no address. */
  latitude?: number;
  /** Exact position, when you have it and no address. */
  longitude?: number;
}

export interface DirectionsOptions {
  /** Where the route starts. Leave it out to start from the person's own position. */
  origin?: DirectionsPlace;
  /** How they travel. Default "driving". */
  mode?: TravelMode;
}

export const APP_NAMES: Record<DirectionsApp, string> = { apple: "Apple Maps", google: "Google Maps", waze: "Waze" };

const validLatitude = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value >= -90 && value <= 90;
const validLongitude = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value >= -180 && value <= 180;

/** "52.370216,4.895168", or null when the place has no valid coordinates. */
export function coordinatesOf(place: DirectionsPlace): string | null {
  if (!validLatitude(place.latitude) || !validLongitude(place.longitude)) return null;
  return `${Number(place.latitude.toFixed(6))},${Number(place.longitude.toFixed(6))}`;
}

/**
 * The text a maps app searches for. With an address it is the name and the
 * address together ("Kestrel Coffee, 12 Prinsengracht, Amsterdam"), which is
 * what makes the pin carry the place's name; without one, the coordinates.
 */
export function placeQuery(place: DirectionsPlace): string | null {
  const address = place.address?.trim();
  if (address) {
    const name = place.name?.trim();
    // A name the address already contains is not said twice.
    return name && !address.toLowerCase().includes(name.toLowerCase()) ? `${name}, ${address}` : address;
  }
  return coordinatesOf(place);
}

/** Why a place cannot be used, in words, or null when it can. A name alone is not enough to route to. */
export function placeProblem(place: DirectionsPlace): string | null {
  if (placeQuery(place)) return null;
  const hasCoordinates = place.latitude !== undefined || place.longitude !== undefined;
  return hasCoordinates ? "The coordinates are not valid." : "Add an address or coordinates to get directions.";
}

/** What "Copy address" copies: the address, or the coordinates when there is none. */
export function copyTextOf(place: DirectionsPlace): string | null {
  const address = place.address?.trim();
  if (address) return address;
  const coordinates = coordinatesOf(place);
  return coordinates ? coordinates.replace(",", ", ") : null;
}

/** Waze only gives driving directions, so the other modes leave it out. */
export function appsForMode(apps: readonly DirectionsApp[], mode: TravelMode = "driving"): DirectionsApp[] {
  const unique = apps.filter((app, index) => apps.indexOf(app) === index);
  return mode === "driving" ? unique : unique.filter((app) => app !== "waze");
}

/**
 * The apps in the order to offer them. With a list of your own, that order
 * stands. Without one: Apple Maps first on an iPhone or iPad, Google Maps first
 * everywhere else, then the rest.
 */
export function orderApps(apps: readonly DirectionsApp[] | undefined, apple: boolean): DirectionsApp[] {
  if (apps) return apps.filter((app, index) => apps.indexOf(app) === index);
  return apple ? ["apple", "google", "waze"] : ["google", "apple", "waze"];
}

/** An iPhone or iPad, from what the browser says about itself. iPadOS 13 and later calls itself a Mac, but a Mac has no touch screen. */
export function prefersAppleMaps(environment: { userAgent?: string; platform?: string; maxTouchPoints?: number }): boolean {
  if (/iPhone|iPad|iPod/i.test(environment.userAgent ?? "")) return true;
  return environment.platform === "MacIntel" && (environment.maxTouchPoints ?? 0) > 1;
}

const encode = (pairs: readonly (readonly [string, string | undefined])[]) =>
  pairs
    .filter((pair): pair is readonly [string, string] => Boolean(pair[1]))
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join("&");

const GOOGLE_MODE: Record<TravelMode, string> = { driving: "driving", walking: "walking", cycling: "bicycling", transit: "transit" };
// Apple Maps knows driving, walking and transit; for cycling it opens with its own default.
const APPLE_MODE: Partial<Record<TravelMode, string>> = { driving: "d", walking: "w", transit: "r" };

/** https://www.google.com/maps/dir/?api=1&destination=... Returns null when the destination cannot be used. */
export function buildGoogleMapsUrl(destination: DirectionsPlace, options: DirectionsOptions = {}): string | null {
  const to = placeQuery(destination);
  if (!to) return null;
  const from = options.origin ? placeQuery(options.origin) : null;
  return `https://www.google.com/maps/dir/?${encode([
    ["api", "1"],
    ["destination", to],
    ["origin", from ?? undefined],
    ["travelmode", GOOGLE_MODE[options.mode ?? "driving"]],
  ])}`;
}

/** https://maps.apple.com/?daddr=... Opens Maps on an iPhone, iPad and Mac. Returns null when the destination cannot be used. */
export function buildAppleMapsUrl(destination: DirectionsPlace, options: DirectionsOptions = {}): string | null {
  const to = placeQuery(destination);
  if (!to) return null;
  const from = options.origin ? placeQuery(options.origin) : null;
  // A destination given as bare coordinates has no name of its own, so the label goes in the query.
  const label = destination.address?.trim() ? undefined : destination.name?.trim();
  return `https://maps.apple.com/?${encode([
    ["daddr", to],
    ["saddr", from ?? undefined],
    ["dirflg", APPLE_MODE[options.mode ?? "driving"]],
    ["q", label],
  ])}`;
}

/** https://waze.com/ul?... Waze starts from the current position and drives. Returns null when the destination cannot be used. */
export function buildWazeUrl(destination: DirectionsPlace): string | null {
  const text = destination.address?.trim() ? placeQuery(destination) : null;
  if (text) return `https://waze.com/ul?${encode([["q", text], ["navigate", "yes"]])}`;
  const coordinates = coordinatesOf(destination);
  return coordinates ? `https://waze.com/ul?${encode([["ll", coordinates], ["navigate", "yes"]])}` : null;
}

/** The link for one app. */
export function buildDirectionsUrl(app: DirectionsApp, destination: DirectionsPlace, options: DirectionsOptions = {}): string | null {
  if (app === "apple") return buildAppleMapsUrl(destination, options);
  if (app === "waze") return buildWazeUrl(destination);
  return buildGoogleMapsUrl(destination, options);
}

/** Puts text on the clipboard. Where the Clipboard API is missing or blocked, a selected hidden field and the old copy command take over. */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    Object.assign(area.style, { position: "fixed", top: "0", left: "0", width: "1px", height: "1px", opacity: "0", pointerEvents: "none" });
    document.body.append(area);
    const active = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    area.select();
    area.setSelectionRange(0, text.length);
    let copied = false;
    try {
      copied = document.execCommand("copy");
    } catch {
      copied = false;
    }
    area.remove();
    active?.focus({ preventScroll: true });
    return copied;
  }
}
