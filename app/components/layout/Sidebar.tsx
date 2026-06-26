"use client";
import {
  LayoutDashboard, MessageSquare, Clock, List, Search,
  Bell, Settings, LogOut,
} from "lucide-react";
import { PillLogo } from "@/app/components/ui/PillLogo";
import { useApp, Screen } from "@/app/store";

const navItems: { id: Screen; label: string; icon: React.ReactNode }[] = [
  { id: "dashboard",     label: "Dashboard",     icon: <LayoutDashboard size={18} strokeWidth={1.8} /> },
  { id: "rx",            label: "Rx Assistant",  icon: <MessageSquare    size={18} strokeWidth={1.8} /> },
  { id: "duty",          label: "Duty tracker",  icon: <Clock            size={18} strokeWidth={1.8} /> },
  { id: "caselog",       label: "Case log",      icon: <List             size={18} strokeWidth={1.8} /> },
  { id: "search",        label: "Search",        icon: <Search           size={18} strokeWidth={1.8} /> },
  { id: "notifications", label: "Notifications", icon: <Bell             size={18} strokeWidth={1.8} /> },
  { id: "admin",         label: "Admin",         icon: <Settings         size={18} strokeWidth={1.8} /> },
];

const UNREAD = 3;

export function Sidebar() {
  const { state, navigate, set } = useApp();
  const collapsed = false; // responsive collapse handled via CSS

  return (
    <aside
      style={{
        width: 224,
        flexShrink: 0,
        background: "var(--navy)",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        position: "fixed",
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 100,
      }}
      className="sidebar"
    >
      {/* Wordmark */}
      <div style={{ padding: "22px 20px 18px" }}>
        <div style={{ color: "#fff" }}>
          <PillLogo size="sm" />
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "4px 10px", display: "flex", flexDirection: "column", gap: 2 }}>
        {navItems.map((item) => {
          const active = state.screen === item.id ||
            (item.id === "notifications" && state.notifOpen);
          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === "notifications") {
                  set({ notifOpen: !state.notifOpen });
                } else {
                  navigate(item.id);
                }
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "9px 12px",
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
                textAlign: "left",
                transition: "background 0.15s",
                background: active ? "rgba(255,255,255,0.09)" : "transparent",
                color: active ? "#fff" : "rgba(255,255,255,0.62)",
                fontFamily: "'IBM Plex Sans', sans-serif",
                fontWeight: active ? 600 : 400,
                fontSize: 13.5,
                borderLeft: active ? "3px solid var(--accent)" : "3px solid transparent",
                position: "relative",
              }}
            >
              {item.icon}
              <span className="sidebar-label">{item.label}</span>
              {item.id === "notifications" && UNREAD > 0 && (
                <span
                  style={{
                    marginLeft: "auto",
                    background: "var(--accent)",
                    color: "#fff",
                    borderRadius: 999,
                    fontSize: 10.5,
                    fontWeight: 700,
                    padding: "1px 6px",
                    lineHeight: 1.5,
                  }}
                >
                  {UNREAD}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Profile */}
      <div
        style={{
          padding: "14px 14px 20px",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: "50%",
            background: "var(--accent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            fontSize: 12,
            fontWeight: 700,
            color: "#fff",
            letterSpacing: "0.02em",
          }}
        >
          RA
        </div>
        <div className="sidebar-label" style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: "#fff", fontSize: 13, fontWeight: 600, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {state.userName}
          </div>
          <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 11.5 }}>Pharmacist</div>
        </div>
        <button
          onClick={() => navigate("login")}
          title="Sign out"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "rgba(255,255,255,0.45)",
            display: "flex",
            padding: 4,
            borderRadius: 6,
          }}
          className="sidebar-label"
        >
          <LogOut size={15} strokeWidth={1.8} />
        </button>
      </div>
    </aside>
  );
}
