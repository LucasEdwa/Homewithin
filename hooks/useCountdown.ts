import { useEffect, useState } from "react";

export function formatRemaining(ms: number): string {
  if (ms <= 0) return "expired";
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

/**
 * Returns a live-updating human-readable label of how long until `expiresAt`.
 * Updates every 10 seconds. Returns null when no expiry is set.
 */
export function useCountdown(expiresAt?: string): string | null {
  const [label, setLabel] = useState<string | null>(() => {
    if (!expiresAt) return null;
    return formatRemaining(new Date(expiresAt).getTime() - Date.now());
  });

  useEffect(() => {
    if (!expiresAt) return;
    const tick = () =>
      setLabel(formatRemaining(new Date(expiresAt).getTime() - Date.now()));
    const id = setInterval(tick, 10_000);
    return () => clearInterval(id);
  }, [expiresAt]);

  return label;
}
