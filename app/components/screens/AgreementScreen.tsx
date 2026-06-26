"use client";
import { useState } from "react";
import { ShieldAlert, CheckCircle } from "lucide-react";
import { PillLogo } from "@/app/components/ui/PillLogo";
import { useApp } from "@/app/store";

export function AgreementScreen() {
  const { navigate } = useApp();
  const [checked, setChecked] = useState(false);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--page-bg)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
    >
      {/* Top gradient band */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "40%",
          background: "linear-gradient(180deg, #0F2438, #133048)",
          zIndex: 0,
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "min(540px, 100%)",
          background: "#fff",
          borderRadius: 16,
          border: "1px solid var(--border)",
          boxShadow: "0 20px 50px -20px rgba(15,36,56,0.45)",
          padding: "32px 34px 28px",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 22 }}>
          <PillLogo />
        </div>
        <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 18, textAlign: "center", color: "var(--text-primary)" }}>
          Data & privacy agreement
        </h2>

        {/* Red warning */}
        <div
          style={{
            background: "var(--major-bg)",
            border: "1px solid #F0CFCB",
            borderRadius: 10,
            padding: "14px 16px",
            marginBottom: 14,
          }}
        >
          <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
            <ShieldAlert size={17} color="var(--major-text)" strokeWidth={2} style={{ marginTop: 1, flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700, color: "var(--major-text)", fontSize: 13.5, marginBottom: 5 }}>
                No confidential patient data
              </div>
              <div style={{ fontSize: 13, color: "#7A2A20", lineHeight: 1.55 }}>
                Never enter patient names, Civil ID numbers, medical file numbers, phone numbers, or any other identifying information into this system.
              </div>
            </div>
          </div>
        </div>

        {/* Accent allowed panel */}
        <div
          style={{
            background: "var(--accent-soft)",
            border: "1px solid var(--accent-border)",
            borderRadius: 10,
            padding: "14px 16px",
            marginBottom: 22,
          }}
        >
          <div style={{ fontWeight: 600, color: "var(--accent-soft-text)", fontSize: 13, marginBottom: 8 }}>
            You may only enter:
          </div>
          <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 5 }}>
            {[
              "Gender (male / female)",
              "Age",
              "Chronic diseases and allergies",
              "Pregnancy status (where clinically relevant)",
            ].map((item) => (
              <li key={item} style={{ fontSize: 13, color: "var(--accent-soft-text)", lineHeight: 1.5 }}>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Checkbox */}
        <label
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            cursor: "pointer",
            marginBottom: 20,
          }}
        >
          <div
            onClick={() => setChecked(!checked)}
            style={{
              width: 20,
              height: 20,
              borderRadius: 5,
              border: `2px solid ${checked ? "var(--accent)" : "var(--input-border)"}`,
              background: checked ? "var(--accent)" : "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              marginTop: 1,
              transition: "all 0.15s",
              cursor: "pointer",
            }}
          >
            {checked && (
              <svg width="11" height="8" viewBox="0 0 11 8" fill="none">
                <path d="M1 3.5L4 6.5L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </div>
          <span style={{ fontSize: 13.5, color: "var(--text-primary)", lineHeight: 1.55 }}>
            I understand and agree that I must not enter any confidential patient information. I will only provide anonymised clinical data as described above.
          </span>
        </label>

        {/* Button */}
        <button
          disabled={!checked}
          onClick={() => navigate("dashboard")}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: 44,
            borderRadius: 10,
            border: "none",
            cursor: checked ? "pointer" : "not-allowed",
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontWeight: 600,
            fontSize: 14,
            background: checked ? "var(--accent)" : "var(--disabled)",
            color: "#fff",
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => checked && (e.currentTarget.style.background = "var(--accent-dark)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = checked ? "var(--accent)" : "var(--disabled)")}
        >
          Agree and continue
        </button>
      </div>
    </div>
  );
}
