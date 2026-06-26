"use client";
import { Check } from "lucide-react";
import { useApp } from "@/app/store";

export function Toast() {
  const { state } = useApp();
  if (!state.toastOn) return null;

  return (
    <div
      className="toast-animate"
      style={{
        position: "fixed",
        bottom: 28,
        left: "50%",
        zIndex: 9999,
        background: "var(--navy)",
        color: "#fff",
        borderRadius: 999,
        padding: "10px 20px",
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontSize: 13.5,
        fontWeight: 500,
        boxShadow: "0 14px 34px -12px rgba(15,36,56,0.55)",
        whiteSpace: "nowrap",
        pointerEvents: "none",
      }}
    >
      <span
        style={{
          background: "var(--accent)",
          borderRadius: "50%",
          width: 20,
          height: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Check size={12} strokeWidth={2.5} color="#fff" />
      </span>
      {state.toastMsg}
    </div>
  );
}
