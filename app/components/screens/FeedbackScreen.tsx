"use client";
import { useState } from "react";
import { CheckCircle, MessageCircle } from "lucide-react";
import { Card } from "@/app/components/ui/Card";
import { useApp } from "@/app/store";

const CATEGORIES = [
  { label: "Feature idea",  bg: "var(--accent-soft)",  text: "var(--accent-soft-text)",  border: "var(--accent-border)" },
  { label: "Bug report",    bg: "var(--major-bg)",      text: "var(--major-text)",         border: "#F5C6C6" },
  { label: "Complaint",     bg: "var(--amber-bg)",      text: "var(--amber-text)",         border: "var(--amber-border)" },
  { label: "General",       bg: "var(--border-2)",      text: "var(--text-secondary)",     border: "var(--border)" },
];

export function FeedbackScreen() {
  const { submitFeedback, showToast } = useApp();

  const [category, setCategory] = useState("Feature idea");
  const [message, setMessage]   = useState("");
  const [loading, setLoading]   = useState(false);
  const [done, setDone]         = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) return;
    setLoading(true);
    try {
      await submitFeedback(category, message.trim());
      setDone(true);
    } catch {
      showToast("Something went wrong — please try again");
    } finally {
      setLoading(false);
    }
  };

  const handleAnother = () => {
    setCategory("Feature idea");
    setMessage("");
    setDone(false);
  };

  return (
    <div style={{ padding: "clamp(18px,3vw,26px) clamp(16px,3.5vw,32px)" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4, letterSpacing: "-0.01em" }}>Send Feedback</h1>
        <p style={{ fontSize: 13.5, color: "var(--text-secondary)", margin: 0 }}>
          Your message goes directly to the app admin. Share ideas, report bugs, or anything on your mind.
        </p>
      </div>

      <div style={{ maxWidth: 560 }}>
        {done ? (
          /* ── Success state ── */
          <Card style={{ textAlign: "center", padding: "48px 32px" }}>
            <div style={{
              width: 52, height: 52, borderRadius: "50%",
              background: "var(--accent-soft)", border: "1.5px solid var(--accent-border)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px",
            }}>
              <CheckCircle size={24} color="var(--accent)" strokeWidth={2} />
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Thank you!</div>
            <div style={{ fontSize: 13.5, color: "var(--text-secondary)", marginBottom: 24, lineHeight: 1.6 }}>
              Your feedback has been received. The admin will review it shortly.
            </div>
            <button
              onClick={handleAnother}
              style={{
                height: 38, padding: "0 20px",
                background: "var(--accent-soft)", color: "var(--accent-soft-text)",
                border: "1px solid var(--accent-border)", borderRadius: 8,
                cursor: "pointer", fontFamily: "'IBM Plex Sans',sans-serif",
                fontWeight: 600, fontSize: 13,
                display: "inline-flex", alignItems: "center", gap: 6,
              }}
            >
              <MessageCircle size={14} /> Send another
            </button>
          </Card>
        ) : (
          /* ── Form ── */
          <Card>
            {/* Category */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Category
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {CATEGORIES.map((cat) => {
                  const active = category === cat.label;
                  return (
                    <button
                      key={cat.label}
                      onClick={() => setCategory(cat.label)}
                      style={{
                        height: 34, padding: "0 14px",
                        background: active ? cat.bg : "var(--card-bg)",
                        color: active ? cat.text : "var(--text-secondary)",
                        border: `1.5px solid ${active ? cat.border : "var(--input-border)"}`,
                        borderRadius: 999,
                        cursor: "pointer",
                        fontFamily: "'IBM Plex Sans',sans-serif",
                        fontWeight: active ? 600 : 400,
                        fontSize: 13,
                        transition: "all 0.12s",
                      }}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Message */}
            <div style={{ marginBottom: 22 }}>
              <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your idea, issue, or feedback in as much detail as you like…"
                rows={6}
                style={{
                  display: "block", width: "100%",
                  border: "1px solid var(--input-border)", borderRadius: 10,
                  padding: "12px 14px",
                  fontFamily: "'IBM Plex Sans',sans-serif", fontSize: 13.5,
                  color: "var(--text-primary)", resize: "vertical",
                  outline: "none", lineHeight: 1.6,
                  transition: "border-color 0.15s",
                }}
                onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--input-border)")}
              />
              <div style={{ marginTop: 6, fontSize: 12, color: "var(--text-faint)", textAlign: "right" }}>
                {message.length} characters
              </div>
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={loading || !message.trim()}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                width: "100%", height: 44,
                background: "var(--accent)", color: "#fff",
                border: "none", borderRadius: 10,
                cursor: loading || !message.trim() ? "not-allowed" : "pointer",
                fontFamily: "'IBM Plex Sans',sans-serif", fontWeight: 600, fontSize: 14,
                opacity: loading || !message.trim() ? 0.55 : 1,
                transition: "opacity 0.15s",
              }}
            >
              {loading ? "Sending…" : "Send feedback"}
            </button>
          </Card>
        )}
      </div>
    </div>
  );
}
