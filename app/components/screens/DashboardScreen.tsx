"use client";
import { MessageSquare, FileText, AlertTriangle } from "lucide-react";
import { Card } from "@/app/components/ui/Card";
import { SeverityBadge } from "@/app/components/ui/Badge";
import { useApp } from "@/app/store";

function StatCard({
  label, value, sub, progress, total, color,
}: {
  label: string; value: string | number; sub?: string;
  progress?: number; total?: number; color?: string;
}) {
  return (
    <Card style={{ minWidth: 0 }}>
      <div style={{ fontSize: 12.5, color: "var(--text-muted)", fontWeight: 500, letterSpacing: "0.03em", textTransform: "uppercase", marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ fontSize: 26, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1, marginBottom: sub ? 4 : 0 }}>
        {value}
        {total && (
          <span style={{ fontSize: 15, fontWeight: 500, color: "var(--text-faint)" }}>/{total}</span>
        )}
      </div>
      {sub && <div style={{ fontSize: 12.5, color: "var(--minor-text)", marginTop: 2 }}>{sub}</div>}
      {progress !== undefined && total !== undefined && (
        <div style={{ marginTop: 10, height: 5, borderRadius: 99, background: "var(--border)", overflow: "hidden" }}>
          <div
            style={{
              height: "100%",
              width: `${Math.min(100, (progress / total) * 100)}%`,
              background: color || "var(--accent)",
              borderRadius: 99,
              transition: "width 0.4s",
            }}
          />
        </div>
      )}
    </Card>
  );
}

const flaggedCases = [
  { id: "c1", drug: "Warfarin + Aspirin", severity: "Major" as const },
];

export function DashboardScreen() {
  const { state, navigate, set, showToast } = useApp();
  const resolvedFlagged = flaggedCases.filter((c) => !state.resolvedIds.includes(c.id));
  const today = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div style={{ padding: "clamp(18px,3vw,26px) clamp(16px,3.5vw,32px)" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 22, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 3, letterSpacing: "-0.01em" }}>Dashboard</h1>
          <div style={{ fontSize: 13.5, color: "var(--text-secondary)" }}>{today}</div>
        </div>
        <button
          onClick={() => navigate("rx")}
          style={{
            display: "flex", alignItems: "center", gap: 7,
            height: 38, padding: "0 16px",
            background: "var(--accent)", color: "#fff",
            border: "none", borderRadius: 9, cursor: "pointer",
            fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 600, fontSize: 13.5,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--accent-dark)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "var(--accent)")}
        >
          <MessageSquare size={15} strokeWidth={2} />
          Ask Rx Assistant
        </button>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(168px,1fr))", gap: 12, marginBottom: 16 }}>
        <StatCard label="On-call shifts" value={6} total={30} progress={6} />
        <StatCard label="Hours today" value="5.5" total={7} progress={5.5} />
        <StatCard label="Cases this month" value={34} sub="+6 vs last month" />
        <StatCard label="DRPs caught" value={12} />
      </div>

      {/* Compliance banner */}
      <Card style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <div
          style={{
            width: 8, height: 8, borderRadius: "50%",
            background: "var(--accent)", flexShrink: 0,
          }}
        />
        <div style={{ flex: 1, minWidth: 120 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 5 }}>Shift compliance</div>
          <div style={{ height: 5, borderRadius: 99, background: "var(--border)", overflow: "hidden" }}>
            <div style={{ height: "100%", width: "94%", background: "var(--accent)", borderRadius: 99 }} />
          </div>
        </div>
        <span
          style={{
            background: "var(--accent-soft)", color: "var(--accent-soft-text)",
            borderRadius: 999, padding: "3px 12px", fontSize: 12.5, fontWeight: 600,
          }}
        >
          On track · 94%
        </span>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px,1fr))", gap: 14 }}>
        {/* Needs doctor follow-up */}
        {resolvedFlagged.length > 0 && (
          <Card style={{ padding: 0, overflow: "hidden" }}>
            <div
              style={{
                background: "var(--amber-bg)", borderBottom: "1px solid var(--amber-border)",
                padding: "12px 16px", display: "flex", alignItems: "center", gap: 8,
              }}
            >
              <AlertTriangle size={15} color="var(--amber-text)" strokeWidth={2} />
              <span style={{ fontWeight: 700, color: "var(--amber-text)", fontSize: 13.5 }}>Needs doctor follow-up</span>
              <span
                style={{
                  marginLeft: "auto",
                  background: "#F0DFC0", color: "var(--amber-text)",
                  borderRadius: 999, fontSize: 11, fontWeight: 700, padding: "1px 8px",
                }}
              >
                {resolvedFlagged.length}
              </span>
            </div>
            <div style={{ padding: "4px 0" }}>
              {resolvedFlagged.map((c) => (
                <div
                  key={c.id}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "10px 16px", borderBottom: "1px solid var(--border-2)",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: 13, color: "var(--text-primary)", flex: 1,
                    }}
                  >
                    {c.drug}
                  </span>
                  <SeverityBadge sev={c.severity} />
                  <button
                    onClick={() => {
                      set({ resolvedIds: [...state.resolvedIds, c.id] });
                      showToast("Marked as resolved");
                    }}
                    style={{
                      background: "none", border: "1px solid var(--border)",
                      borderRadius: 7, padding: "4px 12px", cursor: "pointer",
                      fontSize: 12, fontWeight: 500, color: "var(--text-secondary)",
                      fontFamily: "'IBM Plex Sans', sans-serif",
                    }}
                  >
                    Mark resolved
                  </button>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Recent cases */}
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: 700, fontSize: 13.5 }}>Recent cases</span>
            <button
              onClick={() => navigate("caselog")}
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: "var(--accent)", fontWeight: 600, fontSize: 13,
                fontFamily: "'IBM Plex Sans', sans-serif",
              }}
            >
              View all
            </button>
          </div>
          {state.cases.slice(0, 4).map((c) => (
            <div
              key={c.id}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "10px 16px", borderBottom: "1px solid var(--border-2)",
              }}
            >
              <FileText size={14} color="var(--text-muted)" strokeWidth={1.8} />
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12.5, flex: 1, color: "var(--text-primary)" }}>
                {c.countOnly ? <em style={{ color: "var(--text-muted)", fontStyle: "italic" }}>Count only</em> : c.meds}
              </span>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{c.date}</span>
              {!c.countOnly && <SeverityBadge sev={c.severity} />}
            </div>
          ))}
          {state.cases.length === 0 && (
            <div style={{ padding: "30px 20px", textAlign: "center" }}>
              <FileText size={28} color="var(--text-faint)" strokeWidth={1.5} style={{ margin: "0 auto 10px" }} />
              <div style={{ fontSize: 13.5, color: "var(--text-muted)", marginBottom: 12 }}>No cases yet</div>
              <button
                onClick={() => navigate("rx")}
                style={{
                  background: "var(--accent-soft)", color: "var(--accent-soft-text)",
                  border: "1px solid var(--accent-border)", borderRadius: 8,
                  padding: "7px 16px", cursor: "pointer", fontSize: 13, fontWeight: 600,
                  fontFamily: "'IBM Plex Sans', sans-serif",
                }}
              >
                Start a check
              </button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
