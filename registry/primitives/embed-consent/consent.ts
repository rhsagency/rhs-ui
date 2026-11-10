/**
 * What the visitor agreed to, kept per provider. A "yes, always" lives in
 * localStorage so it survives the visit; where storage is blocked (some
 * private modes) it is kept for the page's lifetime instead, so the choice
 * still works and nothing throws. Every embed of the same provider on the
 * page, and in every other tab, hears about a change through `subscribe`.
 */
const PREFIX = "rhs-ui:embed-consent:";
const listeners = new Set<() => void>();
const session = new Set<string>();
let listening = false;

/** "Kestrel Maps" and "kestrel  maps" are one provider: the key is the name in lower case, with runs of other characters as one dash. */
export function consentKey(provider: string): string {
  return PREFIX + (provider.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "provider");
}

function notify(): void {
  for (const listener of listeners) listener();
}

/** Whether the visitor said yes for good to this provider, here or in another tab. */
export function hasConsent(provider: string): boolean {
  const key = consentKey(provider);
  try {
    return window.localStorage.getItem(key) === "1";
  } catch {
    // Storage is blocked: only what was said on this page counts.
    return session.has(key);
  }
}

/** Remember a yes for this provider. */
export function giveConsent(provider: string): void {
  const key = consentKey(provider);
  try {
    window.localStorage.setItem(key, "1");
  } catch {
    session.add(key);
  }
  notify();
}

/** Forget it, so the provider is asked again. */
export function revokeConsent(provider: string): void {
  const key = consentKey(provider);
  session.delete(key);
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Nothing stored, nothing to remove.
  }
  notify();
}

function onStorage(event: StorageEvent): void {
  if (event.key === null || event.key.startsWith(PREFIX)) notify();
}

/** Call back when any answer changes, in this tab or another. Returns the way to stop. */
export function subscribeConsent(listener: () => void): () => void {
  listeners.add(listener);
  if (!listening && typeof window !== "undefined") {
    window.addEventListener("storage", onStorage);
    listening = true;
  }
  return () => {
    listeners.delete(listener);
    if (!listeners.size && listening) {
      window.removeEventListener("storage", onStorage);
      listening = false;
    }
  };
}
