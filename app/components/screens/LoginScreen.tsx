"use client";
import { useState } from "react";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { PillLogo } from "@/app/components/ui/PillLogo";
import { SegmentedControl } from "@/app/components/ui/SegmentedControl";
import { useApp } from "@/app/store";

export function LoginScreen() {
  const { state, set, signIn, signUp } = useApp();
  const [showPw, setShowPw] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [fullName, setFullName] = useState("");
  const isSignup = state.authMode === "signup";

  const handleSubmit = async () => {
    if (isSignup) {
      if (password !== confirmPw) {
        set({ authError: "Passwords do not match" });
        return;
      }
      await signUp(email, password, fullName, state.role);
    } else {
      await signIn(email, password);
    }
  };

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
      <div
        style={{
          position: "absolute", top: 0, left: 0, right: 0,
          height: "40%",
          background: "linear-gradient(180deg, #0F2438, #133048)",
          zIndex: 0,
        }}
      />

      <div
        style={{
          position: "relative", zIndex: 1,
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

        {/* Error */}
        {state.authError && (
          <div
            style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "var(--major-bg)", border: "1px solid #F0CFCB",
              borderRadius: 8, padding: "9px 12px", marginBottom: 14,
            }}
          >
            <AlertCircle size={14} color="var(--major-text)" />
            <span style={{ fontSize: 12.5, color: "var(--major-text)" }}>{state.authError}</span>
          </div>
        )}

        {/* Fields */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={labelStyle}>I am a</label>
            <SegmentedControl
              options={["Employee", "Student"]}
              value={state.role}
              onChange={(v) => set({ role: v as "Employee" | "Student" })}
            />
          </div>

          {isSignup && (
            <div>
              <label style={labelStyle}>Full name</label>
              <input
                style={inputStyle}
                placeholder="Your name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
          )}

          <div>
            <label style={labelStyle}>Email</label>
            <input
              style={inputStyle}
              placeholder="you@moh.gov.kw"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>

          <div>
            <label style={labelStyle}>Password</label>
            <div style={{ position: "relative" }}>
              <input
                style={{ ...inputStyle, paddingRight: 40 }}
                placeholder="••••••••"
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              />
              <button
                onClick={() => setShowPw(!showPw)}
                style={{
                  position: "absolute", right: 10, top: "50%",
                  transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer",
                  color: "var(--text-muted)", display: "flex",
                }}
              >
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {isSignup && (
            <div>
              <label style={labelStyle}>Confirm password</label>
              <input
                style={{ ...inputStyle, paddingRight: 40 }}
                placeholder="••••••••"
                type="password"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              />
            </div>
          )}
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={state.authLoading}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: "100%", height: 44, marginTop: 22,
            borderRadius: 10, border: "none",
            cursor: state.authLoading ? "not-allowed" : "pointer",
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontWeight: 600, fontSize: 14,
            background: state.authLoading ? "var(--disabled)" : "var(--accent)",
            color: "#fff", transition: "background 0.15s",
          }}
          onMouseEnter={(e) => !state.authLoading && (e.currentTarget.style.background = "var(--accent-dark)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = state.authLoading ? "var(--disabled)" : "var(--accent)")}
        >
          {state.authLoading ? "Please wait…" : isSignup ? "Create account" : "Sign in"}
        </button>

        {/* Toggle */}
        <div style={{ textAlign: "center", marginTop: 18, fontSize: 13, color: "var(--text-secondary)" }}>
          {isSignup ? "Already have an account? " : "New to Pillr? "}
          <button
            onClick={() => set({ authMode: isSignup ? "signin" : "signup", authError: "" })}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "var(--accent)", fontWeight: 600,
              fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 13, padding: 0,
            }}
          >
            {isSignup ? "Sign in" : "Create account"}
          </button>
        </div>

        <div
          style={{
            textAlign: "center", marginTop: 20,
            fontSize: 11.5, color: "#98A1AC",
            borderTop: "1px solid var(--border-2)", paddingTop: 14,
          }}
        >
          State of Kuwait · Ministry of Health
        </div>
      </div>
    </div>
  );
}
