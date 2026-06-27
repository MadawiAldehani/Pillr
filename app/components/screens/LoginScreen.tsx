"use client";
import { useState } from "react";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { PillLogo } from "@/app/components/ui/PillLogo";
import { SegmentedControl } from "@/app/components/ui/SegmentedControl";
import { useApp } from "@/app/store";

/**
 * Check a password against the HaveIBeenPwned Pwned Passwords API using
 * k-anonymity: only the first 5 characters of the SHA-1 hash are sent,
 * so the actual password never leaves the device.
 * Fails open — returns false if the API is unreachable so sign-up is never blocked.
 */
async function isPasswordBreached(password: string): Promise<boolean> {
  try {
    const encoded    = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-1", encoded);
    const hashHex    = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase();

    const prefix = hashHex.slice(0, 5);   // sent to API (k-anonymity)
    const suffix = hashHex.slice(5);       // checked locally

    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { "Add-Padding": "true" },  // prevents response-size traffic analysis
    });
    if (!res.ok) return false;

    const text = await res.text();
    for (const line of text.split("\n")) {
      const [lineSuffix, countStr] = line.split(":");
      if (lineSuffix.trim().toUpperCase() === suffix && parseInt(countStr, 10) > 0) {
        return true;
      }
    }
    return false;
  } catch {
    return false; // fail-open: network issues must not block registration
  }
}

export function LoginScreen() {
  const { state, set, signIn, signUp } = useApp();
  const [showPw, setShowPw] = useState(false);
  const [breachChecking, setBreachChecking] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [fullName, setFullName] = useState("");
  const isSignup = state.authMode === "signup";

  const handleSubmit = async () => {
    if (isSignup) {
      if (!fullName.trim()) {
        set({ authError: "Please enter your full name" });
        return;
      }
      if (!email.trim()) {
        set({ authError: "Please enter your email address" });
        return;
      }
      // ASVS 5.0 §2.1.1 — minimum 12 characters
      if (password.length < 12) {
        set({ authError: "Password must be at least 12 characters" });
        return;
      }
      if (password !== confirmPw) {
        set({ authError: "Passwords do not match" });
        return;
      }
      // Check against HaveIBeenPwned — password never leaves the device (k-anonymity)
      setBreachChecking(true);
      const breached = await isPasswordBreached(password);
      setBreachChecking(false);
      if (breached) {
        set({ authError: "This password has appeared in a known data breach. Please choose a different password." });
        return;
      }
      await signUp(email, password, fullName, state.role);
    } else {
      if (!email.trim() || !password) {
        set({ authError: "Please enter your email and password" });
        return;
      }
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
          disabled={state.authLoading || breachChecking}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: "100%", height: 44, marginTop: 22,
            borderRadius: 10, border: "none",
            cursor: (state.authLoading || breachChecking) ? "not-allowed" : "pointer",
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontWeight: 600, fontSize: 14,
            background: (state.authLoading || breachChecking) ? "var(--disabled)" : "var(--accent)",
            color: "#fff", transition: "background 0.15s",
          }}
          onMouseEnter={(e) => !(state.authLoading || breachChecking) && (e.currentTarget.style.background = "var(--accent-dark)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = (state.authLoading || breachChecking) ? "var(--disabled)" : "var(--accent)")}
        >
          {breachChecking ? "Checking password safety…" : state.authLoading ? "Please wait…" : isSignup ? "Create account" : "Sign in"}
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
