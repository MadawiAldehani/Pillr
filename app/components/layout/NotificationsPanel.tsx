"use client";
import { X } from "lucide-react";
import { useApp } from "@/app/store";

const notifications = [
  { id: "n1", icon: "✓", title: "Case saved successfully", sub: "Warfarin + Aspirin interaction logged", time: "2 min ago", unread: true },
  { id: "n2", icon: "!", title: "New drug interaction flagged", sub: "Flagged for doctor follow-up", time: "18 min ago", unread: true },
  { id: "n3", icon: "◷", title: "Shift reminder", sub: "On-call shift starts at 20:00", time: "1 hr ago", unread: true },
  { id: "n4", icon: "◔", title: "Clock-in recorded", sub: "Day shift started at 08:00", time: "5 hrs ago", unread: false },
  { id: "n5", icon: "%", title: "Weekly compliance updated", sub: "94% — on track", time: "Yesterday", unread: false },
];

export function NotificationsPanel() {
  const { state, set } = useApp();
  if (!state.notifOpen) return null;

  return (
    <>
      {/* Scrim */}
      <div
        onClick={() => set({ notifOpen: false })}
        style={{
          position: "fixed", inset: 0, background: "rgba(15,36,56,0.28)", zIndex: 200,
        }}
      />
      {/* Panel */}
      <div
        className="panel-animate"
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "min(380px, 100%)",
          background: "#fff",
          boxShadow: "-16px 0 44px -22px rgba(15,36,56,0.4)",
          zIndex: 201,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 20px 16px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>Notifications</span>
            <span
              style={{
                background: "var(--accent)",
                color: "#fff",
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 700,
                padding: "1px 8px",
              }}
            >
              3 new
            </span>
          </div>
          <button
            onClick={() => set({ notifOpen: false })}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)", display: "flex", padding: 4 }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Items */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {notifications.map((n) => (
            <div
              key={n.id}
              style={{
                display: "flex",
                gap: 12,
                padding: "14px 20px",
                borderBottom: "1px solid var(--border-2)",
                background: n.unread ? "var(--accent-soft)" : "#fff",
                borderLeft: n.unread ? "3px solid var(--accent)" : "3px solid transparent",
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: n.unread ? "var(--accent-border)" : "var(--border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                  flexShrink: 0,
                  color: n.unread ? "var(--accent-soft-text)" : "var(--text-secondary)",
                }}
              >
                {n.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-primary)", marginBottom: 2 }}>{n.title}</div>
                <div style={{ fontSize: 12.5, color: "var(--text-secondary)", marginBottom: 4 }}>{n.sub}</div>
                <div style={{ fontSize: 11.5, color: "var(--text-muted)" }}>{n.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
