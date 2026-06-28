"use client";
import { AppProvider, useApp } from "@/app/store";
import { LoginScreen } from "@/app/components/screens/LoginScreen";
import { AgreementScreen } from "@/app/components/screens/AgreementScreen";
import { ResetPasswordScreen } from "@/app/components/screens/ResetPasswordScreen";
import { AppShell } from "@/app/components/layout/AppShell";

function AppRouter() {
  const { state } = useApp();
  if (state.screen === "login") return <LoginScreen />;
  if (state.screen === "agreement") return <AgreementScreen />;
  if (state.screen === "resetpassword") return <ResetPasswordScreen />;
  return <AppShell />;
}

export function PillrApp() {
  return (
    <AppProvider>
      <AppRouter />
    </AppProvider>
  );
}
