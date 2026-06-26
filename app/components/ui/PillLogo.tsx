export function PillLogo({ size = "md" }: { size?: "sm" | "md" }) {
  const w = size === "sm" ? 22 : 26;
  const h = size === "sm" ? 12 : 14;
  const font = size === "sm" ? 18 : 21;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div
        style={{
          width: w,
          height: h,
          borderRadius: 99,
          background: "var(--accent)",
          boxShadow: `inset -${w / 2}px 0 0 var(--accent-dark)`,
          transform: "rotate(-45deg)",
          flexShrink: 0,
        }}
      />
      <span
        style={{
          fontFamily: "'IBM Plex Sans', sans-serif",
          fontWeight: 700,
          fontSize: font,
          letterSpacing: "-0.02em",
          lineHeight: 1,
        }}
      >
        Pillr
      </span>
    </div>
  );
}
