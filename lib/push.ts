import { createClient } from "@/lib/supabase";

// VAPID public key — safe to ship to the browser (it is the application server key)
const VAPID_PUBLIC_KEY = "BKNsnmP1j5lSCW41gJLYrPqvgMcvy3HjfOCxuU_NQ1jIh_bo_P7t6jGFX9VTin2A1Q57jm0z1sewDox4oHOUqFo";

export function pushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

// Register the service worker (call once on app load)
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!pushSupported()) return null;
  try {
    return await navigator.serviceWorker.register("/sw.js");
  } catch {
    return null;
  }
}

// Is the user currently subscribed on this device?
export async function isSubscribed(): Promise<boolean> {
  if (!pushSupported()) return false;
  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg) return false;
  const sub = await reg.pushManager.getSubscription();
  return !!sub;
}

// Ask permission, subscribe, and persist the subscription to Supabase.
// Must be triggered by a user gesture (button tap) — iOS requires it.
export async function enablePush(): Promise<{ ok: boolean; reason?: string }> {
  if (!pushSupported()) return { ok: false, reason: "unsupported" };

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return { ok: false, reason: "denied" };

  const reg = (await navigator.serviceWorker.getRegistration()) || (await registerServiceWorker());
  if (!reg) return { ok: false, reason: "no-sw" };

  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
    });
  }

  const json = sub.toJSON();
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { ok: false, reason: "no-session" };

  // Upsert keyed by endpoint so re-subscribing on the same device is idempotent
  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: session.user.id,
      endpoint: json.endpoint,
      p256dh: json.keys?.p256dh,
      auth: json.keys?.auth,
    },
    { onConflict: "endpoint" }
  );
  if (error) return { ok: false, reason: error.message };
  return { ok: true };
}

// Unsubscribe on this device and remove the row
export async function disablePush(): Promise<void> {
  if (!pushSupported()) return;
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = reg && (await reg.pushManager.getSubscription());
  if (sub) {
    const endpoint = sub.endpoint;
    await sub.unsubscribe();
    const supabase = createClient();
    await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
  }
}
