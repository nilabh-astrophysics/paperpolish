// apps/web/lib/analytics.ts
// Minimal, dependency-free analytics sender for dev.

const BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";
const ENDPOINT = `${BASE}/_events`;

/** Try to send via Beacon; fallback to fetch */
function send(payload: Record<string, any>) {
  try {
    const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
    if (navigator.sendBeacon && navigator.sendBeacon(ENDPOINT, blob)) return;
  } catch {
    // ignore and fallback
  }

  // Fallback (non-blocking)
  fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    keepalive: true, // helps during unload
  }).catch(() => {});
}

/** Track a custom event */
export function track(kind: string, props: Record<string, any> = {}) {
  const page =
    typeof window !== "undefined" && typeof location !== "undefined"
      ? location.pathname
      : null;

  const payload = {
    kind,
    page,
    ts: Date.now(),
    ...props,
  };

  send(payload);
}

/** Convenience hook for pageviews */
export function trackPageview(label?: string) {
  track("pageview", { label });
}
