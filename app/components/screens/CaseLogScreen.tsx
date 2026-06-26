"use client";
import { useEffect } from "react";
import { Plus, Download, X } from "lucide-react";
import { Card } from "@/app/components/ui/Card";
import { SeverityBadge } from "@/app/components/ui/Badge";
import { SegmentedControl } from "@/app/components/ui/SegmentedControl";
import { useApp, Severity } from "@/app/store";

export function CaseLogScreen() {
  const { state, set, showToast, fetchCases, addCase } = useApp();
  const { cases, addOpen, addMeds, addSev, addDrp } = state;

  useEffect(() => { fetchCases(); }, []);

  const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  const todayCount = cases.filter((c) => c.date === today).length;
  const weekCount = cases.length; // simplified
  const monthCount = cases.length;

  const handleQuickAdd = async () => {
    await addCase({ meds: "", severity: "None", drp: false, flagged: false, counsel: "", source: "Manual", countOnly: true });
    showToast("Case count logged");
  };

  const handleAddCase = async () => {
    await addCase({ meds: addMeds, severity: addSev, drp: addDrp, flagged: false, counsel: "", source: "Manual", countOnly: !addMeds.trim() });
    set({ addOpen: false, addMeds: "", addSev: "None", addDrp: false });
    showToast("Case added");
  };

  return (
    <div style={{ padding: "clamp(18px,3vw,26px) clamp(16px,3.5vw,32px)", position: "relative" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 3, letterSpacing: "-0.01em" }}>Case log</h1>
          <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>{cases.length} cases saved</div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            onClick={handleQuickAdd}
            style={{
              height: 36, padding: "0 14px",
              background: "var(--accent-soft)", color: "var(--accent-soft-text)",
              border: "1px solid var(--accent-border)",
              borderRadius: 8, cursor: "pointer",
              fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 600, fontSize: 13,
            }}
          >
            Quick +1
          </button>
          <button
            onClick={() => set({ addOpen: true })}
            style={{
              height: 36, padding: "0 14px",
              background: "var(--accent)", color: "#fff",
              border: "none", borderRadius: 8, cursor: "pointer",
              fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 600, fontSize: 13,
              display: "flex", alignItems: "center", gap: 6,
            }}
          >
            <Plus size={14} />
            Add case
          </button>
          <button
            onClick={() => showToast("Exported — check your downloads")}
            style={{
              height: 36, padding: "0 14px",
              background: "#fff", color: "var(--text-secondary)",
              border: "1px solid var(--border)",
              borderRadius: 8, cursor: "pointer",
              fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 500, fontSize: 13,
              display: "flex", alignItems: "center", gap: 6,
            }}
          >
            <Download size={13} />
            Export
          </button>
        </div>
      </div>

      {/* Count cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12, marginBottom: 18 }}>
        {[
          { label: "Cases today", value: todayCount },
          { label: "This week", value: weekCount },
          { label: "This month", value: monthCount },
        ].map((s) => (
          <Card key={s.label}>
            <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.03em", marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "var(--text-primary)" }}>{s.value}</div>
          </Card>
        ))}
      </div>

      {/* Table */}
      {cases.length === 0 ? (
        <Card style={{ textAlign: "center", padding: "48px 20px" }}>
          <div style={{ fontSize: 13.5, color: "var(--text-muted)" }}>No saved cases</div>
        </Card>
      ) : (
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", minWidth: 820, borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--subtle-bg)", borderBottom: "1px solid var(--border)" }}>
                  {["Date", "Medications", "Severity", "Counselling", "DRP", "Flagged"].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "10px 14px",
                        textAlign: "left",
                        fontSize: 11.5,
                        fontWeight: 600,
                        color: "var(--text-muted)",
                        letterSpacing: "0.04em",
                        textTransform: "uppercase",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cases.map((c, i) => (
                  <tr
                    key={c.id}
                    style={{ borderBottom: "1px solid var(--border-2)", background: i % 2 === 0 ? "#fff" : "var(--subtle-bg)" }}
                  >
                    <td style={{ padding: "11px 14px", whiteSpace: "nowrap" }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>{c.date}</div>
                      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11.5, color: "var(--text-muted)", marginTop: 2 }}>{c.time}</div>
                    </td>
                    <td style={{ padding: "11px 14px" }}>
                      {c.countOnly ? (
                        <span style={{ fontStyle: "italic", color: "var(--text-muted)", fontSize: 13 }}>Count only — no details</span>
                      ) : (
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, color: "var(--text-primary)" }}>{c.meds}</span>
                          <span
                            style={{
                              background: c.source === "Rx" ? "var(--accent-soft)" : "var(--border-2)",
                              color: c.source === "Rx" ? "var(--accent-soft-text)" : "var(--text-secondary)",
                              borderRadius: 999, fontSize: 10.5, padding: "1px 7px", fontWeight: 600,
                            }}
                          >
                            {c.source}
                          </span>
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "11px 14px" }}>
                      {c.countOnly ? <span style={{ color: "var(--text-faint)" }}>—</span> : <SeverityBadge sev={c.severity} />}
                    </td>
                    <td style={{ padding: "11px 14px", maxWidth: 200 }}>
                      <span style={{ fontSize: 13, color: "var(--text-secondary)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {c.countOnly ? "—" : (c.counsel || "—")}
                      </span>
                    </td>
                    <td style={{ padding: "11px 14px", textAlign: "center" }}>
                      {c.countOnly ? "—" : (c.drp ? <span style={{ color: "var(--major-text)", fontWeight: 600, fontSize: 13 }}>Yes</span> : <span style={{ color: "var(--text-muted)", fontSize: 13 }}>No</span>)}
                    </td>
                    <td style={{ padding: "11px 14px", textAlign: "center" }}>
                      {c.countOnly ? "—" : (c.flagged ? <span style={{ color: "var(--amber-text)", fontWeight: 600, fontSize: 13 }}>Yes</span> : <span style={{ color: "var(--text-muted)", fontSize: 13 }}>No</span>)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Add case modal */}
      {addOpen && (
        <>
          <div
            onClick={() => set({ addOpen: false })}
            style={{ position: "fixed", inset: 0, background: "rgba(15,36,56,0.28)", zIndex: 300 }}
          />
          <div
            className="panel-animate"
            style={{
              position: "fixed",
              top: "50%", left: "50%",
              transform: "translate(-50%,-50%)",
              width: "min(440px,calc(100vw - 32px))",
              background: "#fff",
              borderRadius: 16, border: "1px solid var(--border)",
              boxShadow: "0 20px 50px -20px rgba(15,36,56,0.45)",
              padding: "24px 26px",
              zIndex: 301,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <span style={{ fontSize: 16, fontWeight: 700 }}>Add case</span>
              <button
                onClick={() => set({ addOpen: false })}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex" }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 12.5, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 5 }}>
                  Medications / case <span style={{ color: "var(--text-faint)" }}>— optional</span>
                </label>
                <input
                  value={addMeds}
                  onChange={(e) => set({ addMeds: e.target.value })}
                  placeholder="Leave blank to log a count only"
                  style={{
                    display: "block", width: "100%", height: 40,
                    border: "1px solid var(--input-border)", borderRadius: 8,
                    padding: "0 12px", fontFamily: "'IBM Plex Sans', sans-serif",
                    fontSize: 13.5, outline: "none",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12.5, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 5 }}>Severity</label>
                <SegmentedControl
                  options={["None", "Minor", "Moderate", "Major"]}
                  value={addSev}
                  onChange={(v) => set({ addSev: v as Severity })}
                  size="sm"
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12.5, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 5 }}>DRP resolved</label>
                <SegmentedControl
                  options={["No", "Yes"]}
                  value={addDrp ? "Yes" : "No"}
                  onChange={(v) => set({ addDrp: v === "Yes" })}
                  size="sm"
                />
              </div>
            </div>

            <button
              onClick={handleAddCase}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: "100%", height: 42, marginTop: 22,
                background: "var(--accent)", color: "#fff",
                border: "none", borderRadius: 9, cursor: "pointer",
                fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 600, fontSize: 14,
              }}
            >
              {addMeds.trim() ? "Add case" : "Log count only"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
