"use client";
import { useApp } from "@/app/store";
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
      <NotificationsPanel />
      <Toast />
    </div>
  );
}
