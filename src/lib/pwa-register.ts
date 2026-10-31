/**
 * Guarded PWA registration wrapper.
 * Never registers in dev, Lovable preview, iframes, or when ?sw=off is present.
 * Unregisters stale /sw.js in any refused context.
 */
export async function registerPWA() {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;

  const host = window.location.hostname;
  const url = new URL(window.location.href);
  const inIframe = window.self !== window.top;
  const refused =
    !import.meta.env.PROD ||
    inIframe ||
    host.startsWith("id-preview--") ||
    host.startsWith("preview--") ||
    host === "lovableproject.com" ||
    host.endsWith(".lovableproject.com") ||
    host === "lovableproject-dev.com" ||
    host.endsWith(".lovableproject-dev.com") ||
    host === "beta.lovable.dev" ||
    host.endsWith(".beta.lovable.dev") ||
    url.searchParams.get("sw") === "off";

  if (refused) {
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.allSettled(
        regs
          .filter((r) => r.active?.scriptURL.endsWith("/sw.js"))
          .map((r) => r.unregister()),
      );
    } catch { /* ignore */ }
    return;
  }

  try {
    await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  } catch { /* ignore */ }
}
