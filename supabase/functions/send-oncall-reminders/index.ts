import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CRON_SECRET  = Deno.env.get("CRON_SECRET")!;

webpush.setVapidDetails(
  Deno.env.get("VAPID_SUBJECT") || "mailto:admin@pillr.app",
  Deno.env.get("VAPID_PUBLIC_KEY")!,
  Deno.env.get("VAPID_PRIVATE_KEY")!,
);

// Kuwait is UTC+3 year-round (no daylight saving)
const KUWAIT_OFFSET_MS = 3 * 60 * 60 * 1000;

interface Sub { endpoint: string; p256dh: string; auth: string; }

Deno.serve(async (req: Request) => {
  // Authorise the scheduled caller via a shared secret
  const secret = req.headers.get("x-cron-secret");
  if (!secret || secret !== CRON_SECRET) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

  // Compute tomorrow's window in Kuwait local time, expressed as UTC instants
  const kuwaitNow = new Date(Date.now() + KUWAIT_OFFSET_MS);
  const y = kuwaitNow.getUTCFullYear();
  const mo = kuwaitNow.getUTCMonth();
  const d = kuwaitNow.getUTCDate() + 1; // tomorrow
  const tomorrowStartUTC = Date.UTC(y, mo, d, 0, 0, 0) - KUWAIT_OFFSET_MS;
  const dayAfterStartUTC = Date.UTC(y, mo, d + 1, 0, 0, 0) - KUWAIT_OFFSET_MS;

  // On-call shifts that start tomorrow (Kuwait)
  const { data: shifts, error } = await admin
    .from("shifts")
    .select("user_id, clocked_in_at, type")
    .eq("type", "oncall")
    .gte("clocked_in_at", new Date(tomorrowStartUTC).toISOString())
    .lt("clocked_in_at", new Date(dayAfterStartUTC).toISOString());

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json" } });

  let notified = 0;
  for (const shift of shifts || []) {
    const { data: subs } = await admin
      .from("push_subscriptions").select("endpoint, p256dh, auth").eq("user_id", shift.user_id);
    if (!subs || subs.length === 0) continue;

    const start = new Date(shift.clocked_in_at);
    const kStart = new Date(start.getTime() + KUWAIT_OFFSET_MS);
    const hh = String(kStart.getUTCHours()).padStart(2, "0");
    const mm = String(kStart.getUTCMinutes()).padStart(2, "0");

    const payload = JSON.stringify({
      title: "On-call reminder 🕐",
      body: `You have an on-call shift tomorrow at ${hh}:${mm}.`,
      url: "/",
      tag: `oncall-${shift.clocked_in_at}`,
    });

    for (const s of subs as Sub[]) {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload);
        notified++;
      } catch (err: unknown) {
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          await admin.from("push_subscriptions").delete().eq("endpoint", s.endpoint);
        }
      }
    }
  }

  return new Response(JSON.stringify({ ok: true, shifts: shifts?.length || 0, notified }), { headers: { "Content-Type": "application/json" } });
});
