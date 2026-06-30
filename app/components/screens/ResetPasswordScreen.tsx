"use client";
import { useState } from "react";
import { Eye, EyeOff, AlertCircle, CheckCircle } from "lucide-react";
import { PillLogo } from "@/app/components/ui/PillLogo";
import { useApp } from "@/app/store";

export function ResetPasswordScreen() {
  const { updatePassword, set } = useApp();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    setError("");
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPw) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await updatePassword(newPassword);
      setSuccess(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not update password. Please try again.");
    } finally {
      setLoading(false);
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
    background: "var(--card-bg)",
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
          background: "var(--card-bg)",
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
            {success ? "Password updated" : "Set a new password"}
          </div>
        </div>

        {success ? (
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                background: "#F0FAF4", border: "1px solid #9FD4B2",
                borderRadius: 8, padding: "12px 16px", marginBottom: 22,
              }}
            >
              <CheckCircle size={15} color="#22863a" />
              <span style={{ fontSize: 13, color: "#22863a" }}>
                Your password has been updated successfully.
              </span>
            </div>
            <button
              onClick={() => set({ screen: "login" })}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: "100%", height: 44,
                borderRadius: 10, border: "none",
                cursor: "pointer",
                fontFamily: "'IBM Plex Sans', sans-serif",
                fontWeight: 600, fontSize: 14,
                background: "var(--accent)",
                color: "#fff",
              }}
            >
              Sign in
            </button>
          </div>
        ) : (
          <>
            {/* Error */}
            {error && (
              <div
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  background: "var(--major-bg)", border: "1px solid #F0CFCB",
                  borderRadius: 8, padding: "9px 12px", marginBottom: 14,
                }}
              >
                <AlertCircle size={14} color="var(--major-text)" />
                <span style={{ fontSize: 12.5, color: "var(--major-text)" }}>{error}</span>
              </div>
            )}

            {/* Fields */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={labelStyle}>New password</label>
                <div style={{ position: "relative" }}>
                  <input
                    style={{ ...inputStyle, paddingRight: 40 }}
                    placeholder="Min. 8 characters"
                    type={showPw ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
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

              <div>
                <label style={labelStyle}>Confirm new password</label>
                <input
                  style={inputStyle}
                  placeholder="••••••••"
                  type="password"
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                />
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: "100%", height: 44, marginTop: 22,
                borderRadius: 10, border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                fontFamily: "'IBM Plex Sans', sans-serif",
                fontWeight: 600, fontSize: 14,
                background: loading ? "var(--disabled)" : "var(--accent)",
                color: "#fff", transition: "background 0.15s",
              }}
              onMouseEnter={(e) => !loading && (e.currentTarget.style.background = "var(--accent-dark)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = loading ? "var(--disabled)" : "var(--accent)")}
            >
              {loading ? "Updating…" : "Update password"}
            </button>
          </>
        )}

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
