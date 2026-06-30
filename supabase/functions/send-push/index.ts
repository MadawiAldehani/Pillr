import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY      = Deno.env.get("SUPABASE_ANON_KEY")!;

webpush.setVapidDetails(
  Deno.env.get("VAPID_SUBJECT") || "mailto:admin@pillr.app",
  Deno.env.get("VAPID_PUBLIC_KEY")!,
  Deno.env.get("VAPID_PRIVATE_KEY")!,
);

interface Sub { endpoint: string; p256dh: string; auth: string; }

async function sendToSubs(subs: Sub[], payload: Record<string, unknown>, admin: ReturnType<typeof createClient>) {
  const body = JSON.stringify(payload);
  let sent = 0;
  for (const s of subs) {
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, body);
      sent++;
    } catch (err: unknown) {
      const status = (err as { statusCode?: number }).statusCode;
      // 404/410 = subscription gone; remove it so we stop trying
      if (status === 404 || status === 410) {
        await admin.from("push_subscriptions").delete().eq("endpoint", s.endpoint);
      }
    }
  }
  return sent;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    // Caller must be an authenticated admin
    const authHeader = req.headers.get("Authorization") || "";
    const userClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...CORS, "Content-Type": "application/json" } });

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: profile } = await admin.from("profiles").select("is_admin").eq("id", user.id).single();
    if (!profile?.is_admin) return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: { ...CORS, "Content-Type": "application/json" } });

    const { userId, title, body, url } = await req.json();
    if (!title || !body) return new Response(JSON.stringify({ error: "title and body required" }), { status: 400, headers: { ...CORS, "Content-Type": "application/json" } });

    let q = admin.from("push_subscriptions").select("endpoint, p256dh, auth");
    if (userId) q = q.eq("user_id", userId);
    const { data: subs } = await q;

    const sent = await sendToSubs((subs as Sub[]) || [], { title, body, url: url || "/" }, admin);
    return new Response(JSON.stringify({ ok: true, sent }), { headers: { ...CORS, "Content-Type": "application/json" } });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { ...CORS, "Content-Type": "application/json" } });
  }
});
