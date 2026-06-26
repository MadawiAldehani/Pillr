import { Severity } from "@/app/store";

const sevStyles: Record<Severity, { bg: string; color: string }> = {
  Major:    { bg: "var(--major-bg)",    color: "var(--major-text)" },
  Moderate: { bg: "var(--moderate-bg)", color: "var(--moderate-text)" },
  Minor:    { bg: "var(--minor-bg)",    color: "var(--minor-text)" },
  None:     { bg: "var(--border-2)",    color: "var(--text-secondary)" },
};

export function SeverityBadge({ sev }: { sev: Severity }) {
  const s = sevStyles[sev];
  return (
    <span
      style={{
        background: s.bg,
        color: s.color,
        borderRadius: 999,
        padding: "2px 10px",
        fontSize: 12,
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      {sev}
    </span>
  );
}

export function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      style={{
        background: active ? "var(--accent-soft)" : "var(--border-2)",
        color: active ? "var(--accent-soft-text)" : "var(--text-secondary)",
        borderRadius: 999,
        padding: "2px 10px",
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}
