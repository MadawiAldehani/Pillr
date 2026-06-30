"use client";

interface SegmentedControlProps {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  size?: "sm" | "md";
}

export function SegmentedControl({ options, value, onChange, size = "md" }: SegmentedControlProps) {
  const h = size === "sm" ? 32 : 36;
  return (
    <div
      style={{
        display: "inline-flex",
        border: `1px solid var(--input-border)`,
        borderRadius: 10,
        overflow: "hidden",
        background: "var(--card-bg)",
      }}
    >
      {options.map((opt) => {
        const active = opt === value;
        return (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            style={{
              height: h,
              padding: "0 14px",
              fontSize: 13,
              fontWeight: active ? 600 : 400,
              fontFamily: "'IBM Plex Sans', sans-serif",
              border: "none",
              borderLeft: "1px solid var(--input-border)",
              cursor: "pointer",
              transition: "all 0.15s",
              background: active ? "var(--accent-soft)" : "var(--card-bg)",
              color: active ? "var(--accent-soft-text)" : "var(--text-secondary)",
              outline: active ? `1.5px solid var(--accent-border)` : "none",
              outlineOffset: -1,
            }}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}
