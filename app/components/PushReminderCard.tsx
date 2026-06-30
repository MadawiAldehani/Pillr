"use client";
import { useEffect, useState } from "react";
import { Bell, BellOff, BellRing, Check } from "lucide-react";
import { Card } from "@/app/components/ui/Card";
import { pushSupported, isSubscribed, enablePush, disablePush } from "@/lib/push";

// Detect an installed (home-screen) PWA — iOS only delivers push in standalone mode
function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
}
function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export function PushReminderCard() {
  const [supported, setSupported] = useState(true);
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [iosNeedsInstall, setIosNeedsInstall] = useState(false);

  useEffect(() => {
    const ok = pushSupported();
    setSupported(ok);
    if (isIOS() && !isStandalone()) setIosNeedsInstall(true);
    if (ok) isSubscribed().then(setSubscribed);
  }, []);

  const onEnable = async () => {
    setBusy(true); setMsg("");
    const res = await enablePush();
    setBusy(false);
    if (res.ok) {
      setSubscribed(true);
      setMsg("Reminders on — you'll get a notification the day before each on-call shift.");
    } else if (res.reason === "denied") {
      setMsg("Notifications are blocked. Enable them for Pillr in your device settings, then try again.");
    } else if (res.reason === "unsupported") {
      setMsg("This device or browser doesn't support notifications.");
    } else {
      setMsg("Couldn't turn on reminders. Please try again.");
    }
  };

  const onDisable = async () => {
    setBusy(true); setMsg("");
    await disablePush();
    setSubscribed(false);
    setBusy(false);
    setMsg("Reminders turned off on this device.");
  };

  if (!supported && !iosNeedsInstall) return null;

  return (
    <Card style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
      <div
        style={{
          width: 42, height: 42, borderRadius: 11, flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: subscribed ? "var(--accent-soft)" : "var(--indigo-bg)",
        }}
      >
        {subscribed
          ? <BellRing size={21} color="var(--accent)" strokeWidth={2} />
          : <Bell size={21} color="var(--indigo-text)" strokeWidth={2} />}
      </div>

      <div style={{ flex: 1, minWidth: 170 }}>
        <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--text-primary)" }}>
          On-call shift reminders
        </div>
        <div style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 2, lineHeight: 1.5 }}>
          {iosNeedsInstall
            ? "Add Pillr to your home screen first (Share → Add to Home Screen), then open it from the icon to turn on reminders."
            : subscribed
              ? "On — we'll notify you the day before each on-call shift."
              : "Get a notification one day before every on-call shift."}
          {msg && (
            <div style={{ marginTop: 6, color: subscribed ? "var(--accent-soft-text)" : "var(--amber-text)", fontWeight: 500 }}>
              {msg}
            </div>
          )}
        </div>
      </div>

      {!iosNeedsInstall && (
        subscribed ? (
          <button
            onClick={onDisable}
            disabled={busy}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              height: 38, padding: "0 16px",
              background: "transparent", color: "var(--text-secondary)",
              border: "1px solid var(--border)", borderRadius: 9,
              cursor: busy ? "not-allowed" : "pointer", flexShrink: 0,
              fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 600, fontSize: 13.5,
              opacity: busy ? 0.6 : 1,
            }}
          >
            <BellOff size={15} strokeWidth={2} /> Turn off
          </button>
        ) : (
          <button
            onClick={onEnable}
            disabled={busy}
            style={{
              display: "flex", alignItems: "center", gap: 7,
              height: 38, padding: "0 18px",
              background: "var(--indigo-text)", color: "#fff",
              border: "none", borderRadius: 9,
              cursor: busy ? "not-allowed" : "pointer", flexShrink: 0,
              fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 600, fontSize: 13.5,
              opacity: busy ? 0.6 : 1,
            }}
          >
            {busy ? "…" : <><Check size={15} strokeWidth={2} /> Enable reminders</>}
          </button>
        )
      )}
    </Card>
  );
}
