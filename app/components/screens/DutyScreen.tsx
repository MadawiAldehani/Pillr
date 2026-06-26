"use client";
import { Card } from "@/app/components/ui/Card";
import { useApp } from "@/app/store";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const ON_CALL_DAYS = [4, 6, 11, 13, 18, 20, 27];

function DayCell({ day, isToday, isFri, isSat, isOnCall }: {
  day: number; isToday: boolean; isFri: boolean; isSat: boolean; isOnCall: boolean;
}) {
  const isOff = isFri || isSat;
  return (
    <div
      style={{
        minHeight: 84, padding: "8px", borderRight: "1px solid var(--border-2)",
        borderBottom: "1px solid var(--border-2)",
        background: isToday ? "var(--accent-soft)" : "#fff",
        outline: isToday ? "2px solid var(--accent)" : "none",
        outlineOffset: -1,
        position: "relative",
      }}
    >
      {/* Day number */}
      <div style={{ fontSize: 12, fontWeight: 600, color: isToday ? "var(--accent-soft-text)" : "var(--text-secondary)", marginBottom: 4 }}>
        {day}
      </div>
      {/* On call tag */}
      {isOnCall && !isOff && (
        <div
          style={{
            position: "absolute", top: 6, right: 6,
            background: "var(--indigo-bg)", color: "var(--indigo-text)",
            borderRadius: 99, fontSize: 9.5, fontWeight: 600, padding: "1px 6px",
            border: "1px solid var(--indigo-border)",
          }}
        >
          On call
        </div>
      )}
      {/* Shifts */}
      {isOff ? (
        <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 8, border: "1px dashed var(--border)", borderRadius: 5, textAlign: "center", padding: "4px" }}>
          Off
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)", flexShrink: 0 }} />
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, color: "var(--text-primary)" }}>08:00–15:00</span>
            <span style={{ fontSize: 10, color: "var(--text-muted)" }}>7h</span>
          </div>
          {isOnCall && (
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--indigo-text)", flexShrink: 0 }} />
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, color: "var(--indigo-text)" }}>20:00–03:00</span>
              <span style={{ fontSize: 10, color: "var(--text-muted)" }}>7h</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function DutyScreen() {
  const { state, set, showToast } = useApp();
  const today = 27;

  return (
    <div style={{ padding: "clamp(18px,3vw,26px) clamp(16px,3.5vw,32px)" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 18, letterSpacing: "-0.01em" }}>Duty tracker</h1>

      {/* Clock in/out */}
      <Card style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <div
          style={{
            width: 10, height: 10, borderRadius: "50%",
            background: state.clockedIn ? "var(--accent)" : "#C7CDD4",
            flexShrink: 0,
          }}
        />
        <div style={{ flex: 1, minWidth: 100 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
            {state.clockedIn ? "On shift" : "Off shift"}
          </div>
          <div style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 2 }}>
            {state.clockedIn ? "Started at 08:00 · 5h 32m elapsed" : "Last shift ended at 15:00"}
          </div>
        </div>
        <button
          onClick={() => {
            const next = !state.clockedIn;
            set({ clockedIn: next });
            showToast(next ? "Clocked in successfully" : "Clocked out — shift saved");
          }}
          style={{
            height: 38, padding: "0 20px",
            background: state.clockedIn ? "transparent" : "var(--accent)",
            color: state.clockedIn ? "var(--major-text)" : "#fff",
            border: state.clockedIn ? "1.5px solid var(--major-text)" : "none",
            borderRadius: 9, cursor: "pointer",
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontWeight: 600, fontSize: 13.5,
          }}
        >
          {state.clockedIn ? "Clock out" : "Clock in"}
        </button>
      </Card>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px,1fr))", gap: 12, marginBottom: 18 }}>
        {[
          { label: "Total hours logged", value: "165 hrs", sub: "Day shifts + on-call combined" },
          { label: "Day shifts", value: "16 days", sub: "7 h each · 112 h", color: "var(--accent)" },
          { label: "On-call shifts", value: "6 / 30", sub: "shifts · 7 h each · 42 h", color: "var(--indigo-text)" },
          { label: "Compliance", value: "94%", sub: "On track", color: "var(--accent)" },
        ].map((s) => (
          <Card key={s.label} style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.03em", marginBottom: 6 }}>
              {s.label}
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color || "var(--text-primary)", marginBottom: 3 }}>
              {s.value}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{s.sub}</div>
          </Card>
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 14 }}>
        {[
          { label: "Day shift · 7h", color: "var(--accent)" },
          { label: "On call", color: "var(--indigo-text)", bg: "var(--indigo-bg)" },
          { label: "Incomplete", color: "#9A6A12", bg: "var(--amber-bg)" },
          { label: "Today", color: "var(--accent)", outline: true },
        ].map((l) => (
          <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-secondary)" }}>
            <div
              style={{
                width: 10, height: 10, borderRadius: "50%",
                background: l.bg || l.color,
                border: l.outline ? `2px solid ${l.color}` : "none",
                flexShrink: 0,
              }}
            />
            {l.label}
          </div>
        ))}
      </div>

      {/* Calendar */}
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <div style={{ minWidth: 600 }}>
            {/* Day headers */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", background: "var(--subtle-bg)", borderBottom: "1px solid var(--border)" }}>
              {DAYS.map((d) => (
                <div key={d} style={{ padding: "8px", fontSize: 11.5, fontWeight: 600, color: "var(--text-muted)", textAlign: "center", letterSpacing: "0.04em" }}>
                  {d}
                </div>
              ))}
            </div>
            {/* Weeks — June 2026 starts on Mon (index 1) */}
            {[0, 1, 2, 3, 4].map((week) => (
              <div key={week} style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)" }}>
                {DAYS.map((_, dayIdx) => {
                  const day = week * 7 + dayIdx - 0; // June 1 = Mon (col 1)
                  // June 2026: 1st = Monday, so offset = 1
                  const actualDay = week * 7 + dayIdx - 1 + 1;
                  if (actualDay < 1 || actualDay > 30) {
                    return <div key={dayIdx} style={{ minHeight: 84, borderRight: "1px solid var(--border-2)", borderBottom: "1px solid var(--border-2)", background: "var(--page-bg)" }} />;
                  }
                  const isToday = actualDay === today;
                  const isFri = dayIdx === 5;
                  const isSat = dayIdx === 6;
                  const isOnCall = ON_CALL_DAYS.includes(actualDay);
                  return (
                    <DayCell key={dayIdx} day={actualDay} isToday={isToday} isFri={isFri} isSat={isSat} isOnCall={isOnCall} />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
