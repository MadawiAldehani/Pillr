"use client";
import { Search } from "lucide-react";
import { Card } from "@/app/components/ui/Card";
import { StatusBadge } from "@/app/components/ui/Badge";

const adminRows = [
  { name: "Reem Al-Saleh",   initials: "RA", compliance: 94, cases: 34, drps: 12, active: true },
  { name: "Faisal Al-Mutairi", initials: "FM", compliance: 88, cases: 27, drps: 8, active: true },
  { name: "Sara Al-Rashidi", initials: "SR", compliance: 76, cases: 19, drps: 4, active: true },
  { name: "Khaled Boureslan", initials: "KB", compliance: 61, cases: 11, drps: 2, active: false },
  { name: "Nour Al-Enezi",   initials: "NE", compliance: 97, cases: 41, drps: 15, active: true },
  { name: "Ahmad Al-Sabah",  initials: "AS", compliance: 83, cases: 22, drps: 6, active: true },
];

function ComplianceBar({ pct }: { pct: number }) {
  const color = pct >= 90 ? "var(--accent)" : pct >= 75 ? "#D4A017" : "var(--major-text)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ width: 80, height: 5, borderRadius: 99, background: "var(--border)", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 99 }} />
      </div>
      <span style={{ fontSize: 12.5, fontWeight: 600, color }}>{pct}%</span>
    </div>
  );
}

export function AdminScreen() {
  return (
    <div style={{ padding: "clamp(18px,3vw,26px) clamp(16px,3.5vw,32px)" }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 3, letterSpacing: "-0.01em" }}>Admin dashboard</h1>
        <div style={{ fontSize: 13.5, color: "var(--text-secondary)" }}>24 registered pharmacists</div>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Total users", value: 24 },
          { label: "Active this month", value: 19 },
          { label: "Total cases logged", value: 612 },
        ].map((s) => (
          <Card key={s.label}>
            <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.03em", marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "var(--text-primary)" }}>{s.value}</div>
          </Card>
        ))}
      </div>

      {/* Search + filter */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
          <Search
            size={14}
            style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}
          />
          <input
            placeholder="Search pharmacist…"
            style={{
              display: "block", width: "100%", height: 36,
              border: "1px solid var(--input-border)", borderRadius: 8,
              paddingLeft: 32, paddingRight: 12,
              fontFamily: "'IBM Plex Sans', sans-serif",
              fontSize: 13.5, outline: "none", background: "#fff",
            }}
          />
        </div>
        <select
          style={{
            height: 36, border: "1px solid var(--input-border)", borderRadius: 8,
            padding: "0 12px", fontFamily: "'IBM Plex Sans', sans-serif",
            fontSize: 13.5, outline: "none", background: "#fff",
            color: "var(--text-secondary)",
          }}
        >
          <option>All statuses</option>
          <option>Active</option>
          <option>Inactive</option>
        </select>
      </div>

      {/* Table */}
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", minWidth: 780, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--subtle-bg)", borderBottom: "1px solid var(--border)" }}>
                {["Pharmacist", "Compliance", "Cases logged", "DRPs caught", "Status"].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "10px 16px",
                      textAlign: "left",
                      fontSize: 11.5, fontWeight: 600,
                      color: "var(--text-muted)",
                      textTransform: "uppercase", letterSpacing: "0.04em",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {adminRows.map((row, i) => (
                <tr
                  key={row.name}
                  style={{
                    borderBottom: "1px solid var(--border-2)",
                    background: i % 2 === 0 ? "#fff" : "var(--subtle-bg)",
                  }}
                >
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div
                        style={{
                          width: 32, height: 32, borderRadius: "50%",
                          background: "var(--accent-soft)",
                          border: "1.5px solid var(--accent-border)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 11, fontWeight: 700, color: "var(--accent-soft-text)",
                          flexShrink: 0,
                        }}
                      >
                        {row.initials}
                      </div>
                      <span style={{ fontSize: 13.5, fontWeight: 500, color: "var(--text-primary)" }}>{row.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <ComplianceBar pct={row.compliance} />
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 13.5, fontWeight: 600, color: "var(--text-primary)" }}>
                    {row.cases}
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 13.5, fontWeight: 600, color: "var(--text-primary)" }}>
                    {row.drps}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <StatusBadge active={row.active} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
