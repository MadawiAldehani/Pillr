"use client";
import { useEffect } from "react";
import { AppProvider, useApp } from "@/app/store";
import { LoginScreen } from "@/app/components/screens/LoginScreen";
import { AgreementScreen } from "@/app/components/screens/AgreementScreen";
import { ResetPasswordScreen } from "@/app/components/screens/ResetPasswordScreen";
import { AppShell } from "@/app/components/layout/AppShell";
import { registerServiceWorker } from "@/lib/push";

function AppRouter() {
  const { state } = useApp();
  if (state.screen === "login") return <LoginScreen />;
  if (state.screen === "agreement") return <AgreementScreen />;
  if (state.screen === "resetpassword") return <ResetPasswordScreen />;
  return <AppShell />;
}

export function PillrApp() {
  // Register the push/PWA service worker once on load
  useEffect(() => { registerServiceWorker(); }, []);

  return (
    <AppProvider>
      <AppRouter />
    </AppProvider>
  );
}
