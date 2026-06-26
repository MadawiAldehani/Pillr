"use client";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { PillLogo } from "@/app/components/ui/PillLogo";
import { SegmentedControl } from "@/app/components/ui/SegmentedControl";
import { useApp } from "@/app/store";

export function LoginScreen() {
  const { state, set, navigate } = useApp();
  const [showPw, setShowPw] = useState(false);
  const isSignup = state.authMode === "signup";

  const btn = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: 44,
    borderRadius: 10,
    border: "none",
    cursor: "pointer",
    fontFamily: "'IBM Plex Sans', sans-serif",
    fontWeight: 600,
    fontSize: 14,
    background: "var(--accent)",
    color: "#fff",
    transition: "background 0.15s",
  } as const;

  const inputStyle = {
    display: "block",
    width: "100%",
    height: 40,
    border: "1px solid var(--input-border)",
    borderRadius: 8,
    padding: "0 12px",
    fontFamily: "'IBM Plex Sans', sans-serif",
    fontSize: 13.5,
    color: "var(--text-primary)",
    outline: "none",
    background: "#fff",
  } as const;

  const labelStyle = {
    display: "block",
    fontSize: 12.5,
    fontWeight: 500,
    color: "var(--text-secondary)",
    marginBottom: 5,
  } as const;

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

      {/* Card */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "min(380px, 100%)",
          background: "#fff",
          borderRadius: 16,
          border: "1px solid var(--border)",
          boxShadow: "0 20px 50px -20px rgba(15,36,56,0.45)",
          padding: "36px 34px 30px",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 26 }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
            <PillLogo />
          </div>
          <div style={{ fontSize: 14, color: "var(--text-secondary)" }}>
            {isSignup ? "Create your account" : "Pharmacist companion"}
          </div>
        </div>

        {/* Fields */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Role */}
          <div>
            <label style={labelStyle}>I am a</label>
            <SegmentedControl
              options={["Employee", "Student"]}
              value={state.role}
              onChange={(v) => set({ role: v as "Employee" | "Student" })}
            />
          </div>

          {/* Full name (signup only) */}
          {isSignup && (
            <div>
              <label style={labelStyle}>Full name</label>
              <input style={inputStyle} placeholder="Your name" type="text" />
            </div>
          )}

          {/* Email */}
          <div>
            <label style={labelStyle}>Email</label>
            <input style={inputStyle} placeholder="you@moh.gov.kw" type="email" />
          </div>

          {/* Password */}
          <div>
            <label style={labelStyle}>Password</label>
            <div style={{ position: "relative" }}>
              <input
                style={{ ...inputStyle, paddingRight: 40 }}
                placeholder="••••••••"
                type={showPw ? "text" : "password"}
              />
              <button
                onClick={() => setShowPw(!showPw)}
                style={{
                  position: "absolute",
                  right: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                  display: "flex",
                }}
              >
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Confirm password (signup only) */}
          {isSignup && (
            <div>
              <label style={labelStyle}>Confirm password</label>
              <input style={{ ...inputStyle, paddingRight: 40 }} placeholder="••••••••" type="password" />
            </div>
          )}
        </div>

        {/* Submit */}
        <button
          style={{ ...btn, marginTop: 22 }}
          onClick={() => navigate("agreement")}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--accent-dark)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "var(--accent)")}
        >
          {isSignup ? "Create account" : "Sign in"}
        </button>

        {/* Toggle */}
        <div style={{ textAlign: "center", marginTop: 18, fontSize: 13, color: "var(--text-secondary)" }}>
          {isSignup ? "Already have an account? " : "New to Pillr? "}
          <button
            onClick={() => set({ authMode: isSignup ? "signin" : "signup" })}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--accent)",
              fontWeight: 600,
              fontFamily: "'IBM Plex Sans', sans-serif",
              fontSize: 13,
              padding: 0,
            }}
          >
            {isSignup ? "Sign in" : "Create account"}
          </button>
        </div>

        {/* Footer */}
        <div
          style={{
            textAlign: "center",
            marginTop: 20,
            fontSize: 11.5,
            color: "#98A1AC",
            borderTop: "1px solid var(--border-2)",
            paddingTop: 14,
          }}
        >
          State of Kuwait · Ministry of Health
        </div>
      </div>
    </div>
  );
}
