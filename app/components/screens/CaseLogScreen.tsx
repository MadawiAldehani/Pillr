"use client";
import { useEffect, useState } from "react";
import { Plus, Download, X, Search } from "lucide-react";
import { Card } from "@/app/components/ui/Card";
import { SeverityBadge } from "@/app/components/ui/Badge";
import { SegmentedControl } from "@/app/components/ui/SegmentedControl";
import { useApp, Severity } from "@/app/store";

const SEV_OPTIONS: (Severity | "All")[] = ["All", "None", "Minor", "Moderate", "Major"];

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}

export function CaseLogScreen() {
  const { state, set, showToast, fetchCases, addCase } = useApp();
  const { cases, addOpen, addMeds, addSev, addDrp } = state;

  // ── Filters ──
  const [search, setSearch] = useState("");
  const [sevFilter, setSevFilter] = useState<Severity | "All">("All");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => { fetchCases(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const now = new Date();
  const today = now.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  // ── Real count cards ──
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const weekAgo      = startOfToday - 6 * 86_400_000;
  const monthStart   = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const todayCount = cases.filter((c) => new Date(c.createdAt).getTime() >= startOfToday).length;
  const weekCount  = cases.filter((c) => new Date(c.createdAt).getTime() >= weekAgo).length;
  const monthCount = cases.filter((c) => new Date(c.createdAt).getTime() >= monthStart).length;

  // ── 6-month activity chart ──
  const months: { label: string; total: number; drps: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mStart = d.getTime();
    const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999).getTime();
    const monthCases = cases.filter((c) => { const t = new Date(c.createdAt).getTime(); return t >= mStart && t <= mEnd; });
    months.push({
      label: d.toLocaleDateString("en-GB", { month: "short" }),
      total: monthCases.length,
      drps: monthCases.filter((c) => c.drp).length,
    });
  }
  const maxVal = Math.max(1, ...months.map((m) => m.total));
  const CHART_H = 104;

  // ── Filtered cases ──
  const filtered = cases.filter((c) => {
    if (search && !c.meds.toLowerCase().includes(search.toLowerCase())) return false;
    if (sevFilter !== "All" && c.severity !== sevFilter) return false;
    if (fromDate && new Date(c.createdAt) < new Date(fromDate)) return false;
    if (toDate) { const end = new Date(toDate); end.setHours(23, 59, 59, 999); if (new Date(c.createdAt) > end) return false; }
    return true;
  });
  const hasActiveFilter = !!search || sevFilter !== "All" || !!fromDate || !!toDate;
  const clearFilters = () => { setSearch(""); setSevFilter("All"); setFromDate(""); setToDate(""); };

  // ── PDF export (print-to-PDF — works on iOS Safari & desktop) ──
  const handleExport = () => {
    const rows = filtered.map((c) => `<tr>
      <td>${c.date}<br><span class="t">${c.time}</span></td>
      <td>${c.countOnly ? "<em>Count only</em>" : escapeHtml(c.meds)}</td>
      <td>${c.countOnly ? "—" : c.severity}</td>
      <td>${c.countOnly ? "—" : escapeHtml(c.counsel || "—")}</td>
      <td>${c.countOnly ? "—" : c.drp ? "Yes" : "No"}</td>
      <td>${c.countOnly ? "—" : c.flagged ? "Yes" : "No"}</td>
    </tr>`).join("");

    const drpCount = filtered.filter((c) => c.drp).length;
    const flaggedCount = filtered.filter((c) => c.flagged).length;
    const rangeLabel = (fromDate || toDate)
      ? `${fromDate || "start"} → ${toDate || "today"}`
      : "All time";

    const html = `<!doctype html><html><head><meta charset="utf-8">
<title>Pillr Case Log — ${escapeHtml(state.userName || "Pharmacist")}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, "Helvetica Neue", Arial, sans-serif; color: #16202E; margin: 32px; }
  .head { display: flex; align-items: center; gap: 10px; border-bottom: 2px solid #1D9E75; padding-bottom: 14px; margin-bottom: 16px; }
  .pill { width: 30px; height: 15px; border-radius: 99px; background: #1D9E75; box-shadow: inset -15px 0 0 #178A66; transform: rotate(-45deg); }
  .brand { font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
  .sub { color: #5A6675; font-size: 13px; margin-left: auto; text-align: right; line-height: 1.5; }
  .meta { font-size: 13px; color: #5A6675; margin-bottom: 14px; }
  .stats { display: flex; gap: 24px; margin-bottom: 18px; }
  .stat .n { font-size: 22px; font-weight: 700; }
  .stat .l { font-size: 11px; color: #8A94A2; text-transform: uppercase; letter-spacing: 0.04em; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th { background: #F4F6F8; text-align: left; padding: 8px 10px; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.04em; color: #5A6675; border-bottom: 1px solid #E6E9ED; }
  td { padding: 8px 10px; border-bottom: 1px solid #EDEFF2; vertical-align: top; }
  td .t { color: #8A94A2; font-size: 10px; }
  .foot { margin-top: 22px; font-size: 10.5px; color: #8A94A2; border-top: 1px solid #E6E9ED; padding-top: 10px; }
  @media print { body { margin: 12mm; } }
</style></head><body>
  <div class="head">
    <div class="pill"></div>
    <div class="brand">Pillr</div>
    <div class="sub"><strong>${escapeHtml(state.userName || "Pharmacist")}</strong><br>${escapeHtml(state.role || "")}</div>
  </div>
  <div class="meta">Case Log Report · Generated ${today} · Range: ${escapeHtml(rangeLabel)}</div>
  <div class="stats">
    <div class="stat"><div class="n">${filtered.length}</div><div class="l">Cases</div></div>
    <div class="stat"><div class="n">${drpCount}</div><div class="l">DRPs caught</div></div>
    <div class="stat"><div class="n">${flaggedCount}</div><div class="l">Flagged</div></div>
  </div>
  <table>
    <thead><tr><th>Date</th><th>Medications</th><th>Severity</th><th>Counselling</th><th>DRP</th><th>Flagged</th></tr></thead>
    <tbody>${rows || '<tr><td colspan="6" style="text-align:center;color:#8A94A2;padding:20px">No cases match the current filters</td></tr>'}</tbody>
  </table>
  <div class="foot">Generated by Pillr — AI Companion for Pharmacists. Contains no patient-identifying information.</div>
</body></html>`;

    // Render into a hidden iframe and print — most reliable path on iOS PWAs
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0"; iframe.style.bottom = "0";
    iframe.style.width = "0"; iframe.style.height = "0"; iframe.style.border = "0";
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow?.document;
    if (!doc) { showToast("Could not open print view"); return; }
    doc.open(); doc.write(html); doc.close();
    setTimeout(() => {
      try { iframe.contentWindow?.focus(); iframe.contentWindow?.print(); }
      catch { showToast("Printing not supported on this device"); }
      setTimeout(() => iframe.remove(), 1500);
    }, 350);
  };

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
            onClick={handleExport}
            title="Export the filtered cases as a printable PDF"
            style={{
              height: 36, padding: "0 14px",
              background: "var(--card-bg)", color: "var(--text-secondary)",
              border: "1px solid var(--border)",
              borderRadius: 8, cursor: "pointer",
              fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 500, fontSize: 13,
              display: "flex", alignItems: "center", gap: 6,
            }}
          >
            <Download size={13} />
            Export PDF
          </button>
        </div>
      </div>

      {/* Count cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12, marginBottom: 14 }}>
        {[
          { label: "Cases today", value: todayCount },
          { label: "Last 7 days", value: weekCount },
          { label: "This month", value: monthCount },
        ].map((s) => (
          <Card key={s.label}>
            <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.03em", marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "var(--text-primary)" }}>{s.value}</div>
          </Card>
        ))}
      </div>

      {/* ── Activity chart (last 6 months) ── */}
      <Card style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
          <span style={{ fontWeight: 700, fontSize: 14 }}>Activity — last 6 months</span>
          <div style={{ display: "flex", gap: 14 }}>
            {[{ c: "var(--accent)", l: "Cases" }, { c: "var(--major-text)", l: "DRPs" }].map((x) => (
              <div key={x.l} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-secondary)" }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: x.c }} />
                {x.l}
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 8, padding: "0 2px" }}>
          {months.map((m) => (
            <div key={m.label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <div style={{ width: "100%", height: CHART_H, display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 5 }}>
                <div
                  title={`${m.total} cases`}
                  style={{ width: 18, height: Math.max(m.total ? 3 : 0, (m.total / maxVal) * CHART_H), background: "var(--accent)", borderRadius: "4px 4px 0 0", transition: "height 0.4s" }}
                />
                <div
                  title={`${m.drps} DRPs`}
                  style={{ width: 18, height: Math.max(m.drps ? 3 : 0, (m.drps / maxVal) * CHART_H), background: "var(--major-text)", borderRadius: "4px 4px 0 0", transition: "height 0.4s" }}
                />
              </div>
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{m.label}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>{m.total}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* ── Filter bar ── */}
      <Card style={{ marginBottom: 18, display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
        {/* Search */}
        <div style={{ position: "relative", flex: 1, minWidth: 180 }}>
          <Search size={14} color="var(--text-muted)" style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)" }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by drug name…"
            style={{
              width: "100%", height: 36, border: "1px solid var(--input-border)", borderRadius: 8,
              padding: "0 12px 0 32px", fontSize: 13, outline: "none",
              fontFamily: "'IBM Plex Sans', sans-serif", color: "var(--text-primary)", background: "var(--card-bg)",
            }}
          />
        </div>
        {/* Severity — wrapping chips so nothing gets clipped on mobile */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {SEV_OPTIONS.map((s) => {
            const active = sevFilter === s;
            return (
              <button
                key={s}
                onClick={() => setSevFilter(s)}
                style={{
                  height: 32, padding: "0 12px", borderRadius: 999, cursor: "pointer",
                  border: `1.5px solid ${active ? "var(--accent-border)" : "var(--input-border)"}`,
                  background: active ? "var(--accent-soft)" : "var(--card-bg)",
                  color: active ? "var(--accent-soft-text)" : "var(--text-secondary)",
                  fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: active ? 600 : 400, fontSize: 12.5,
                }}
              >
                {s}
              </button>
            );
          })}
        </div>
        {/* Date range */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <input
            type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)}
            title="From date"
            style={{ height: 36, border: "1px solid var(--input-border)", borderRadius: 8, padding: "0 8px", fontSize: 12.5, fontFamily: "'IBM Plex Mono', monospace", outline: "none", background: "var(--card-bg)", color: "var(--text-primary)" }}
          />
          <span style={{ color: "var(--text-muted)", fontSize: 13 }}>–</span>
          <input
            type="date" value={toDate} onChange={(e) => setToDate(e.target.value)}
            title="To date"
            style={{ height: 36, border: "1px solid var(--input-border)", borderRadius: 8, padding: "0 8px", fontSize: 12.5, fontFamily: "'IBM Plex Mono', monospace", outline: "none", background: "var(--card-bg)", color: "var(--text-primary)" }}
          />
        </div>
        {hasActiveFilter && (
          <button
            onClick={clearFilters}
            style={{ display: "flex", alignItems: "center", gap: 4, height: 36, padding: "0 12px", background: "none", border: "1px solid var(--border)", borderRadius: 8, cursor: "pointer", fontSize: 12.5, color: "var(--text-secondary)", fontFamily: "'IBM Plex Sans', sans-serif" }}
          >
            <X size={12} /> Clear
          </button>
        )}
      </Card>

      {hasActiveFilter && (
        <div style={{ fontSize: 12.5, color: "var(--text-muted)", marginBottom: 10 }}>
          Showing {filtered.length} of {cases.length} cases
        </div>
      )}

      {/* Table */}
      {filtered.length === 0 ? (
        <Card style={{ textAlign: "center", padding: "48px 20px" }}>
          <div style={{ fontSize: 13.5, color: "var(--text-muted)" }}>
            {cases.length === 0 ? "No saved cases" : "No cases match the current filters"}
          </div>
        </Card>
      ) : (
        <>
        {/* Desktop / tablet: full table */}
        <Card className="only-desktop" style={{ padding: 0, overflow: "hidden" }}>
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
                {filtered.map((c, i) => (
                  <tr
                    key={c.id}
                    style={{ borderBottom: "1px solid var(--border-2)", background: i % 2 === 0 ? "var(--card-bg)" : "var(--subtle-bg)" }}
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

        {/* Mobile: one card per case (no sideways scrolling) */}
        <div className="only-mobile" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map((c) => (
            <Card key={c.id} style={{ padding: "12px 14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: c.countOnly ? 0 : 8 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{c.date}</div>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11.5, color: "var(--text-muted)", marginTop: 2 }}>{c.time}</div>
                </div>
                {!c.countOnly && <SeverityBadge sev={c.severity} />}
              </div>
              {c.countOnly ? (
                <div style={{ fontStyle: "italic", color: "var(--text-muted)", fontSize: 13 }}>Count only — no details</div>
              ) : (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: c.counsel ? 8 : 0 }}>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, color: "var(--text-primary)", wordBreak: "break-word" }}>{c.meds}</span>
                    <span style={{ background: c.source === "Rx" ? "var(--accent-soft)" : "var(--border-2)", color: c.source === "Rx" ? "var(--accent-soft-text)" : "var(--text-secondary)", borderRadius: 999, fontSize: 10.5, padding: "1px 7px", fontWeight: 600 }}>{c.source}</span>
                  </div>
                  {c.counsel && (
                    <div style={{ fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: (c.drp || c.flagged) ? 8 : 0 }}>{c.counsel}</div>
                  )}
                  {(c.drp || c.flagged) && (
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {c.drp && <span style={{ background: "var(--major-bg)", color: "var(--major-text)", borderRadius: 999, fontSize: 11, fontWeight: 600, padding: "2px 9px" }}>DRP</span>}
                      {c.flagged && <span style={{ background: "var(--amber-bg)", color: "var(--amber-text)", borderRadius: 999, fontSize: 11, fontWeight: 600, padding: "2px 9px" }}>Flagged for doctor</span>}
                    </div>
                  )}
                </>
              )}
            </Card>
          ))}
        </div>
        </>
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
              background: "var(--card-bg)",
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
                    fontSize: 13.5, outline: "none", background: "var(--card-bg)", color: "var(--text-primary)",
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
