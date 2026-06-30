"use client";
import { LayoutDashboard, MessageSquare, Clock, List, Search, MessageCircle, Settings } from "lucide-react";
import { useApp, Screen } from "@/app/store";
import { Sidebar } from "@/app/components/layout/Sidebar";
import { NotificationsPanel } from "@/app/components/layout/NotificationsPanel";
import { Toast } from "@/app/components/ui/Toast";
import { DashboardScreen } from "@/app/components/screens/DashboardScreen";
import { RxScreen } from "@/app/components/screens/RxScreen";
import { DutyScreen } from "@/app/components/screens/DutyScreen";
import { CaseLogScreen } from "@/app/components/screens/CaseLogScreen";
import { SearchScreen } from "@/app/components/screens/SearchScreen";
import { AdminScreen } from "@/app/components/screens/AdminScreen";
import { FeedbackScreen } from "@/app/components/screens/FeedbackScreen";
import { OnboardingTour } from "@/app/components/OnboardingTour";

function ScreenRouter() {
  const { state } = useApp();
  switch (state.screen) {
    case "dashboard": return <DashboardScreen />;
    case "rx":        return <RxScreen />;
    case "duty":      return <DutyScreen />;
    case "caselog":   return <CaseLogScreen />;
    case "search":    return <SearchScreen />;
    case "feedback":  return <FeedbackScreen />;
    case "admin":     return <AdminScreen />;
    default:          return <DashboardScreen />;
  }
}

// ── Bottom navigation (mobile only — hidden via CSS above 640 px) ─────────────
function BottomNav() {
  const { state, navigate } = useApp();

  const navItems: { id: Screen; icon: React.ReactNode; label: string }[] = [
    { id: "dashboard", icon: <LayoutDashboard size={20} strokeWidth={1.8} />, label: "Home" },
    { id: "rx",        icon: <MessageSquare   size={20} strokeWidth={1.8} />, label: "Rx" },
    { id: "duty",      icon: <Clock           size={20} strokeWidth={1.8} />, label: "Duty" },
    { id: "caselog",   icon: <List            size={20} strokeWidth={1.8} />, label: "Cases" },
    { id: "search",    icon: <Search          size={20} strokeWidth={1.8} />, label: "Search" },
    // Admins get the Admin tab (where they review feedback); regular users get Feedback
    ...(state.isAdmin
      ? [{ id: "admin" as Screen,    icon: <Settings      size={20} strokeWidth={1.8} />, label: "Admin" }]
      : [{ id: "feedback" as Screen, icon: <MessageCircle size={20} strokeWidth={1.8} />, label: "Feedback" }]),
  ];

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => {
        const active = state.screen === item.id;
        return (
          <button
            key={item.id}
            onClick={() => navigate(item.id)}
            style={{
              position: "relative",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 3,
              flex: 1,
              height: 58,
              padding: "6px 0 4px",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: active ? "var(--accent)" : "rgba(255,255,255,0.48)",
              fontFamily: "'IBM Plex Sans', sans-serif",
              transition: "color 0.15s",
            }}
          >
            {/* Active indicator bar at top */}
            {active && (
              <span
                style={{
                  position: "absolute",
                  top: 0,
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: 32,
                  height: 2.5,
                  background: "var(--accent)",
                  borderRadius: "0 0 4px 4px",
                }}
              />
            )}
            {item.icon}
            <span style={{ fontSize: 10, fontWeight: active ? 600 : 400, letterSpacing: "0.01em" }}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

// ── App shell ─────────────────────────────────────────────────────────────────
export function AppShell() {
  return (
    <div style={{ display: "flex", height: "100vh", background: "var(--page-bg)", overflow: "hidden" }}>
      <Sidebar />
      <main
        style={{
          marginLeft: 224,
          flex: 1,
          overflowY: "auto",
          height: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
        className="main-content"
      >
        <ScreenRouter />
      </main>
      {/* Bottom nav is CSS-hidden on desktop/tablet, shown on mobile (≤640px) */}
      <BottomNav />
      <NotificationsPanel />
      <Toast />
      <OnboardingTour />
    </div>
  );
}
