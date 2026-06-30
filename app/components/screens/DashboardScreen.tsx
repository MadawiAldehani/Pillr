"use client";
import { useEffect, useState } from "react";
import { MessageSquare, FileText, AlertTriangle, Clock, LogIn, LogOut, CheckCircle2 } from "lucide-react";
import { Card } from "@/app/components/ui/Card";
import { SeverityBadge } from "@/app/components/ui/Badge";
import { ThemeToggle } from "@/app/components/ThemeToggle";
import { useApp } from "@/app/store";

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

// Sunday=0 … Thursday=4 are the work days in Kuwait
const WORK_DAYS = new Set([0, 1, 2, 3, 4]);

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
        {total !== undefined && (
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

export function DashboardScreen() {
  const { state, navigate, set, showToast, fetchShifts, fetchCases, clockIn, clockOut } = useApp();

  const now = new Date();
  const today = now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const [elapsed, setElapsed] = useState("");
  const [busy, setBusy] = useState(false);

  // Load data on mount
  useEffect(() => {
    fetchCases();
    fetchShifts(now.getFullYear(), now.getMonth());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Live elapsed counter while clocked in
  useEffect(() => {
    if (!state.clockedIn || !state.clockInTime) { setElapsed(""); return; }
    const tick = () => {
      const diff = Date.now() - new Date(state.clockInTime!).getTime();
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      setElapsed(`${h}h ${m}m`);
    };
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, [state.clockedIn, state.clockInTime]);

  const handleClockToggle = async () => {
    setBusy(true);
    try {
      if (state.clockedIn && state.activeShiftId) {
        await clockOut(state.activeShiftId);
        showToast("Clocked out — shift saved");
      } else {
        await clockIn();
        showToast("Clocked in successfully");
      }
    } finally { setBusy(false); }
  };

  // ── Computed stats ──────────────────────────────────────────────────────────

  // Helper: get local YYYY-MM-DD string from a Date
  const localDateStr = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  const monthStart    = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
  const lastMonthEnd   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999).getTime();
  const daysInMonth    = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  // Cases
  const casesThisMonth  = state.cases.filter(c => new Date(c.createdAt).getTime() >= monthStart);
  const casesLastMonth  = state.cases.filter(c => {
    const t = new Date(c.createdAt).getTime();
    return t >= lastMonthStart && t <= lastMonthEnd;
  });
  const casesDelta      = casesThisMonth.length - casesLastMonth.length;
  const drpsThisMonth   = casesThisMonth.filter(c => c.drp).length;

  // Shifts — on-call count this month
  const monthOnCallCount = state.shifts.filter(s => s.type === "oncall").length;

  // Hours logged today (all shift types)
  const todayStr    = localDateStr(now);
  const todayShifts = state.shifts.filter(s => localDateStr(new Date(s.clockedInAt)) === todayStr);
  const hoursToday  = todayShifts.reduce((sum, s) => {
    const ms = (s.clockedOutAt ? new Date(s.clockedOutAt) : now).getTime()
      - new Date(s.clockedInAt).getTime();
    return sum + ms / 3_600_000;
  }, 0);

  // ── Shift compliance — Kuwait work days (Sun–Thu) ──
  // Required = all work days in the month; completed = unique work days with a day shift logged.
  let requiredShifts = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    if (WORK_DAYS.has(new Date(now.getFullYear(), now.getMonth(), d).getDay())) requiredShifts++;
  }
  const workDaysCovered = new Set(
    state.shifts
      .filter(s => s.type === "day" && WORK_DAYS.has(new Date(s.clockedInAt).getDay()))
      .map(s => localDateStr(new Date(s.clockedInAt)))
  ).size;
  const completedShifts = Math.min(workDaysCovered, requiredShifts);
  const compliance      = requiredShifts === 0 ? 0 : Math.round((completedShifts / requiredShifts) * 100);
  const complianceLabel = compliance >= 80 ? "On track" : compliance >= 50 ? "At risk" : "Needs attention";
  const complianceColor = compliance >= 80 ? "var(--accent)" : "var(--amber-text)";

  // ── Clock-in warning — work day, past shift start, not clocked in, nothing logged today ──
  const isWorkDayToday   = WORK_DAYS.has(now.getDay());
  const [startH, startM] = (state.dayShiftStart || "08:00").split(":").map(Number);
  const shiftStartToday  = new Date(now.getFullYear(), now.getMonth(), now.getDate(), startH || 8, startM || 0);
  const hasDayShiftToday = todayShifts.some(s => s.type === "day");
  const showClockInWarning = isWorkDayToday && now >= shiftStartToday && !state.clockedIn && !hasDayShiftToday;

  // Flagged cases that haven't been resolved yet (exclude count-only entries)
  const resolvedFlagged = state.cases.filter(
    c => c.flagged && !c.countOnly && !state.resolvedIds.includes(c.id)
  );

  return (
    <div style={{ padding: "clamp(18px,3vw,26px) clamp(16px,3.5vw,32px)" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 22, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 3, letterSpacing: "-0.01em" }}>Dashboard</h1>
          <div style={{ fontSize: 13.5, color: "var(--text-secondary)" }}>{today}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <ThemeToggle variant="header" />
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
      </div>

      {/* ── Adaptive shift card — quick clock-in / live timer / not-clocked-in warning ── */}
      <Card
        style={{
          marginBottom: 16,
          display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap",
          background: showClockInWarning ? "var(--amber-bg)" : "var(--card-bg)",
          border: showClockInWarning ? "1px solid var(--amber-border)" : undefined,
        }}
      >
        <div
          style={{
            width: 42, height: 42, borderRadius: 11, flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: state.clockedIn
              ? "var(--accent-soft)"
              : showClockInWarning ? "#F3E3C2" : "var(--border-2)",
          }}
        >
          {state.clockedIn
            ? <CheckCircle2 size={21} color="var(--accent)" strokeWidth={2} />
            : <Clock size={21} color={showClockInWarning ? "var(--amber-text)" : "var(--text-muted)"} strokeWidth={2} />}
        </div>
        <div style={{ flex: 1, minWidth: 150 }}>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: showClockInWarning ? "var(--amber-text)" : "var(--text-primary)" }}>
            {state.clockedIn ? "You're on shift" : showClockInWarning ? "You haven't clocked in yet" : "Off shift"}
          </div>
          <div style={{ fontSize: 12.5, color: showClockInWarning ? "var(--amber-text)" : "var(--text-muted)", marginTop: 2 }}>
            {state.clockedIn && state.clockInTime
              ? `Started ${formatTime(state.clockInTime)} · ${elapsed} elapsed`
              : showClockInWarning
                ? `Your day shift started at ${state.dayShiftStart || "08:00"} — tap to clock in`
                : hasDayShiftToday ? "Day shift completed today ✓" : "No active shift"}
          </div>
        </div>
        <button
          onClick={handleClockToggle}
          disabled={busy}
          style={{
            display: "flex", alignItems: "center", gap: 7,
            height: 40, padding: "0 18px",
            background: state.clockedIn ? "transparent" : "var(--accent)",
            color: state.clockedIn ? "var(--major-text)" : "#fff",
            border: state.clockedIn ? "1.5px solid var(--major-text)" : "none",
            borderRadius: 9, cursor: busy ? "not-allowed" : "pointer",
            fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 600, fontSize: 13.5,
            opacity: busy ? 0.6 : 1, flexShrink: 0,
          }}
        >
          {state.clockedIn ? <LogOut size={15} strokeWidth={2} /> : <LogIn size={15} strokeWidth={2} />}
          {busy ? "…" : state.clockedIn ? "Clock out" : "Clock in"}
        </button>
      </Card>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(168px,1fr))", gap: 12, marginBottom: 16 }}>
        <StatCard
          label="On-call shifts"
          value={monthOnCallCount}
          total={daysInMonth}
          progress={monthOnCallCount}
        />
        <StatCard
          label="Hours today"
          value={hoursToday > 0 ? hoursToday.toFixed(1) : "0"}
          total={7}
          progress={Math.min(hoursToday, 7)}
        />
        <StatCard
          label="Cases this month"
          value={casesThisMonth.length}
          sub={`${casesDelta >= 0 ? "+" : ""}${casesDelta} vs last month`}
        />
        <StatCard
          label="DRPs caught"
          value={drpsThisMonth}
          sub={`${drpsThisMonth === 1 ? "intervention" : "interventions"} this month`}
        />
      </div>

      {/* Compliance banner */}
      <Card style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <div
          style={{
            width: 8, height: 8, borderRadius: "50%",
            background: complianceColor, flexShrink: 0,
          }}
        />
        <div style={{ flex: 1, minWidth: 120 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 5 }}>
            Shift compliance · <span style={{ color: "var(--accent-soft-text)" }}>{completedShifts}/{requiredShifts} work days covered</span>
          </div>
          <div style={{ height: 5, borderRadius: 99, background: "var(--border)", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${compliance}%`, background: complianceColor, borderRadius: 99, transition: "width 0.4s" }} />
          </div>
        </div>
        <span
          style={{
            background: "var(--accent-soft)", color: "var(--accent-soft-text)",
            borderRadius: 999, padding: "3px 12px", fontSize: 12.5, fontWeight: 600,
          }}
        >
          {complianceLabel} · {compliance}%
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
                  background: "var(--amber-border)", color: "var(--amber-text)",
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
                    {c.meds}
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
