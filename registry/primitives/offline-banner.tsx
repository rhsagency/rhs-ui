"use client";

import { useEffect, useState } from "react";

import { IconWifi, IconWifiOff } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface OfflineBannerProps {
  /** Override the browser's own online state, for demos and tests. */
  online?: boolean;
  offlineMessage?: string;
  backMessage?: string;
  className?: string;
}

/**
 * Tells people when the connection drops and when it is back, from the
 * browser's online and offline events. Nothing shows while all is well;
 * "back online" shows briefly, then leaves. Announced politely.
 */
export function OfflineBanner({ online: forced, offlineMessage = "You are offline. Changes will sync when you reconnect.", backMessage = "Back online. Everything is synced.", className }: OfflineBannerProps) {
  const [online, setOnline] = useState(true);
  const [recovered, setRecovered] = useState(false);
  useEffect(() => {
    if (forced !== undefined) return;
    setOnline(navigator.onLine);
    const up = () => { setOnline(true); setRecovered(true); };
    const down = () => { setOnline(false); setRecovered(false); };
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => { window.removeEventListener("online", up); window.removeEventListener("offline", down); };
  }, [forced]);
  useEffect(() => {
    if (!recovered) return;
    const timer = window.setTimeout(() => setRecovered(false), 3000);
    return () => window.clearTimeout(timer);
  }, [recovered]);
  const isOnline = forced ?? online;
  const show = !isOnline || recovered;
  return (
    <div data-slot="offline-banner" role="status" aria-live="polite" className={cn(!show && "sr-only", className)}>
      {show ? (
        <p className={cn("flex items-center justify-center gap-2 px-4 py-2 text-sm [&_svg]:size-4", isOnline ? "bg-muted" : "bg-foreground text-background")}>
          {isOnline ? <IconWifi /> : <IconWifiOff />}
          {isOnline ? backMessage : offlineMessage}
        </p>
      ) : null}
    </div>
  );
}
